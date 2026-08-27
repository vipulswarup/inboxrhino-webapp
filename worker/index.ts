import { Hono } from 'hono';
import { cors } from 'hono/cors';
import PostalMime, { type Address } from 'postal-mime';
import { apiAuth } from './auth';
import type { AttachmentRow, Env, InboxRow, MessageRow, Variables } from './types';
import {
  cleanPreview,
  contentBytes,
  currentPeriod,
  FREE_EMAIL_LIMIT,
  FREE_INBOX_LIMIT,
  generatedPrefix,
  IDEMPOTENCY_MS,
  jsonError,
  normalizePrefix,
  randomId,
  randomToken,
  RETENTION_MS,
  sha256,
  sleep,
  timingSafeEqual,
  toIso,
} from './utils';

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.use('*', async (c, next) => {
  c.set('requestId', c.req.header('CF-Ray') ?? crypto.randomUUID());
  await next();
  c.header('X-Request-Id', c.get('requestId'));
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('Referrer-Policy', 'no-referrer');
});

app.use(
  '*',
  cors({
    origin: (origin) => {
      if (!origin) return '';
      if (origin === 'https://app.inboxrhino.in' || origin.endsWith('.chatgpt.site')) return origin;
      if (/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) return origin;
      return '';
    },
    allowHeaders: ['Authorization', 'Content-Type', 'Idempotency-Key'],
    exposeHeaders: ['X-Request-Id'],
    maxAge: 86400,
  }),
);

app.onError((error, c) => {
  console.error(JSON.stringify({ request_id: c.get('requestId'), error: error instanceof Error ? error.message : 'unknown' }));
  return jsonError(c, 500, 'internal_error', 'The request could not be completed.');
});

app.get('/health', (c) => c.json({ status: 'ok', service: 'inboxrhino-api' }));

app.post('/setup', async (c) => {
  const token = c.req.header('X-Setup-Token') ?? '';
  if (!c.env.SETUP_TOKEN || !timingSafeEqual(token, c.env.SETUP_TOKEN)) {
    return jsonError(c, 403, 'setup_forbidden', 'Setup token is invalid.');
  }
  const existing = await c.env.DB.prepare('SELECT id FROM organisations LIMIT 1').first<{ id: string }>();
  if (existing) return jsonError(c, 409, 'already_setup', 'Initial setup has already been completed.');

  const now = Date.now();
  const organisationId = randomId('org');
  const keyId = randomId('key');
  const publicId = randomToken(8);
  const apiKey = `ir_live_${publicId}_${randomToken(24)}`;
  const prefix = `ir_live_${publicId}`;
  const secretHash = await sha256(apiKey);
  const period = currentPeriod();
  const country = c.req.header('CF-IPCountry') ?? null;

  await c.env.DB.batch([
    c.env.DB.prepare('INSERT INTO organisations (id, name, plan, signup_country, created_at) VALUES (?, ?, ?, ?, ?)').bind(
      organisationId,
      'InboxRhino',
      'free',
      country,
      now,
    ),
    c.env.DB.prepare('INSERT INTO domains (id, name, active, created_at) VALUES (?, ?, 1, ?)').bind('dom_test', 'test.inboxrhino.in', now),
    c.env.DB.prepare('INSERT INTO api_keys (id, organisation_id, name, prefix, secret_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)').bind(
      keyId,
      organisationId,
      'Initial API key',
      prefix,
      secretHash,
      now,
    ),
    c.env.DB.prepare('INSERT INTO usage_counters (organisation_id, period_start, received_count) VALUES (?, ?, 0)').bind(
      organisationId,
      period.key,
    ),
  ]);

  return c.json(
    {
      organisation: { id: organisationId, name: 'InboxRhino', plan: 'free' },
      api_key: apiKey,
      warning: 'This API key is shown only once.',
    },
    201,
  );
});

app.use('/v1/*', apiAuth);

function encodeCursor(createdAt: number, id: string) {
  return btoa(`${createdAt}:${id}`);
}

function decodeCursor(value: string | undefined) {
  if (!value) return null;
  try {
    const [createdAt, id] = atob(value).split(':');
    const timestamp = Number(createdAt);
    return Number.isFinite(timestamp) && id ? { createdAt: timestamp, id } : null;
  } catch {
    return null;
  }
}

function inboxJson(row: InboxRow) {
  return {
    id: row.id,
    address: row.address,
    local_part: row.local_part,
    status: row.status,
    created_at: toIso(row.created_at),
  };
}

app.post('/v1/inboxes', async (c) => {
  const { organisationId } = c.get('auth');
  const idempotencyKey = c.req.header('Idempotency-Key');
  if (idempotencyKey && (idempotencyKey.length < 8 || idempotencyKey.length > 200)) {
    return jsonError(c, 422, 'invalid_idempotency_key', 'Idempotency-Key must be between 8 and 200 characters.');
  }
  if (idempotencyKey) {
    const cached = await c.env.DB.prepare('SELECT response_json FROM idempotency_keys WHERE organisation_id = ? AND key = ? AND expires_at > ?')
      .bind(organisationId, idempotencyKey, Date.now())
      .first<{ response_json: string }>();
    if (cached) return c.json(JSON.parse(cached.response_json), 201);
  }

  let body: { prefix?: unknown } = {};
  try {
    body = await c.req.json<{ prefix?: unknown }>();
  } catch {
    if ((c.req.header('Content-Length') ?? '0') !== '0') return jsonError(c, 422, 'invalid_json', 'Request body must be valid JSON.');
  }
  if (body.prefix !== undefined && normalizePrefix(body.prefix) === null) {
    return jsonError(c, 422, 'invalid_prefix', 'Prefix must be 3–40 lowercase letters, digits or hyphens and cannot be reserved.');
  }

  const count = await c.env.DB.prepare("SELECT COUNT(*) AS count FROM inboxes WHERE organisation_id = ? AND status = 'active'")
    .bind(organisationId)
    .first<{ count: number }>();
  if ((count?.count ?? 0) >= FREE_INBOX_LIMIT) return jsonError(c, 409, 'inbox_quota_exceeded', 'Active inbox quota exceeded.');

  let localPart = body.prefix === undefined ? generatedPrefix() : normalizePrefix(body.prefix)!;
  let address = `${localPart}@test.inboxrhino.in`;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const conflict = await c.env.DB.prepare('SELECT status, quarantine_until FROM inboxes WHERE address = ?').bind(address).first<{
      status: string;
      quarantine_until: number | null;
    }>();
    if (!conflict) break;
    if (body.prefix !== undefined) return jsonError(c, 409, 'address_unavailable', 'That inbox address is unavailable.');
    localPart = generatedPrefix();
    address = `${localPart}@test.inboxrhino.in`;
  }

  const now = Date.now();
  const row: InboxRow = {
    id: randomId('inbox'),
    organisation_id: organisationId,
    local_part: localPart,
    address,
    status: 'active',
    created_at: now,
    deleted_at: null,
  };
  const response = { data: inboxJson(row) };
  const statements = [
    c.env.DB.prepare(
      "INSERT INTO inboxes (id, organisation_id, domain_id, local_part, address, status, created_at) VALUES (?, ?, 'dom_test', ?, ?, 'active', ?)",
    ).bind(row.id, organisationId, localPart, address, now),
  ];
  if (idempotencyKey) {
    statements.push(
      c.env.DB.prepare('INSERT INTO idempotency_keys (organisation_id, key, response_json, created_at, expires_at) VALUES (?, ?, ?, ?, ?)').bind(
        organisationId,
        idempotencyKey,
        JSON.stringify(response),
        now,
        now + IDEMPOTENCY_MS,
      ),
    );
  }
  await c.env.DB.batch(statements);
  return c.json(response, 201);
});

app.get('/v1/inboxes', async (c) => {
  const { organisationId } = c.get('auth');
  const requestedLimit = Number(c.req.query('limit') ?? 50);
  const limit = Math.max(1, Math.min(Number.isFinite(requestedLimit) ? requestedLimit : 50, 100));
  const cursor = decodeCursor(c.req.query('cursor'));
  let query = "SELECT * FROM inboxes WHERE organisation_id = ? AND status = 'active'";
  const values: unknown[] = [organisationId];
  if (cursor) {
    query += ' AND (created_at < ? OR (created_at = ? AND id < ?))';
    values.push(cursor.createdAt, cursor.createdAt, cursor.id);
  }
  query += ' ORDER BY created_at DESC, id DESC LIMIT ?';
  values.push(limit + 1);
  const result = await c.env.DB.prepare(query).bind(...values).all<InboxRow>();
  const rows = result.results.slice(0, limit);
  const next = result.results.length > limit ? rows.at(-1) : null;
  return c.json({ data: rows.map(inboxJson), next_cursor: next ? encodeCursor(next.created_at, next.id) : null });
});

app.get('/v1/inboxes/:id', async (c) => {
  const row = await c.env.DB.prepare("SELECT * FROM inboxes WHERE id = ? AND organisation_id = ? AND status = 'active'")
    .bind(c.req.param('id'), c.get('auth').organisationId)
    .first<InboxRow>();
  if (!row) return jsonError(c, 404, 'inbox_not_found', 'Inbox not found.');
  return c.json({ data: inboxJson(row) });
});

async function objectKeysForMessage(db: D1Database, organisationId: string, messageId: string) {
  const message = await db.prepare('SELECT text_object_key, html_object_key FROM messages WHERE id = ? AND organisation_id = ?')
    .bind(messageId, organisationId)
    .first<{ text_object_key: string | null; html_object_key: string | null }>();
  const attachments = await db.prepare('SELECT object_key FROM attachments WHERE message_id = ? AND organisation_id = ?')
    .bind(messageId, organisationId)
    .all<{ object_key: string }>();
  return [message?.text_object_key, message?.html_object_key, ...attachments.results.map((row) => row.object_key)].filter((key): key is string => Boolean(key));
}

app.delete('/v1/inboxes/:id', async (c) => {
  const { organisationId } = c.get('auth');
  const inbox = await c.env.DB.prepare("SELECT * FROM inboxes WHERE id = ? AND organisation_id = ? AND status = 'active'")
    .bind(c.req.param('id'), organisationId)
    .first<InboxRow>();
  if (!inbox) return jsonError(c, 404, 'inbox_not_found', 'Inbox not found.');
  const objects = await c.env.DB.prepare(
    `SELECT text_object_key AS object_key FROM messages WHERE inbox_id = ? AND text_object_key IS NOT NULL
     UNION ALL SELECT html_object_key FROM messages WHERE inbox_id = ? AND html_object_key IS NOT NULL
     UNION ALL SELECT a.object_key FROM attachments a JOIN messages m ON m.id = a.message_id WHERE m.inbox_id = ?`,
  )
    .bind(inbox.id, inbox.id, inbox.id)
    .all<{ object_key: string }>();
  await Promise.all(objects.results.map((row) => c.env.MAIL.delete(row.object_key)));
  const now = Date.now();
  await c.env.DB.batch([
    c.env.DB.prepare('DELETE FROM attachments WHERE message_id IN (SELECT id FROM messages WHERE inbox_id = ?)').bind(inbox.id),
    c.env.DB.prepare('DELETE FROM messages WHERE inbox_id = ?').bind(inbox.id),
    c.env.DB.prepare("UPDATE inboxes SET status = 'deleted', deleted_at = ?, quarantine_until = ? WHERE id = ?").bind(now, now + RETENTION_MS, inbox.id),
  ]);
  return c.body(null, 204);
});

function messageSummary(row: MessageRow) {
  return {
    id: row.id,
    inbox_id: row.inbox_id,
    from: { name: row.sender_name, address: row.sender_email },
    to: row.recipient,
    subject: row.subject,
    preview: row.preview,
    size_bytes: row.size_bytes,
    received_at: toIso(row.received_at),
    expires_at: toIso(row.expires_at),
  };
}

async function messageContent(env: Env, row: MessageRow) {
  const [textObject, htmlObject, attachmentsResult] = await Promise.all([
    row.text_object_key ? env.MAIL.get(row.text_object_key) : null,
    row.html_object_key ? env.MAIL.get(row.html_object_key) : null,
    env.DB.prepare('SELECT * FROM attachments WHERE message_id = ? ORDER BY id').bind(row.id).all<AttachmentRow>(),
  ]);
  return {
    ...messageSummary(row),
    internet_message_id: row.internet_message_id,
    text: textObject ? await textObject.text() : null,
    html: htmlObject ? await htmlObject.text() : null,
    headers: JSON.parse(row.headers_json) as Array<[string, string]>,
    attachments: attachmentsResult.results.map((attachment) => ({
      id: attachment.id,
      filename: attachment.filename,
      content_type: attachment.content_type,
      size_bytes: attachment.size_bytes,
      disposition: attachment.disposition,
      content_id: attachment.content_id,
      download_url: `https://files.inboxrhino.in/v1/attachments/${attachment.id}`,
    })),
  };
}

async function findMessages(env: Env, organisationId: string, inboxId: string, queryValues: Record<string, string | undefined>) {
  const requestedLimit = Number(queryValues.limit ?? 50);
  const limit = Math.max(1, Math.min(Number.isFinite(requestedLimit) ? requestedLimit : 50, 100));
  const clauses = ['m.organisation_id = ?', 'm.inbox_id = ?'];
  const values: unknown[] = [organisationId, inboxId];
  if (queryValues.subject) {
    clauses.push('LOWER(m.subject) LIKE ?');
    values.push(`%${queryValues.subject.toLowerCase()}%`);
  }
  if (queryValues.sender) {
    clauses.push('LOWER(m.sender_email) = ?');
    values.push(queryValues.sender.toLowerCase());
  }
  if (queryValues.sender_domain) {
    clauses.push("LOWER(SUBSTR(m.sender_email, INSTR(m.sender_email, '@') + 1)) = ?");
    values.push(queryValues.sender_domain.toLowerCase());
  }
  if (queryValues.received_after) {
    const timestamp = Date.parse(queryValues.received_after);
    if (Number.isFinite(timestamp)) {
      clauses.push('m.received_at >= ?');
      values.push(timestamp);
    }
  }
  const sql = `SELECT m.* FROM messages m WHERE ${clauses.join(' AND ')} ORDER BY m.received_at DESC, m.id DESC LIMIT ?`;
  values.push(limit);
  const result = await env.DB.prepare(sql).bind(...values).all<MessageRow>();
  return { rows: result.results, limit };
}

app.get('/v1/inboxes/:id/messages', async (c) => {
  const { organisationId, keyId } = c.get('auth');
  const inboxId = c.req.param('id');
  const inbox = await c.env.DB.prepare("SELECT id FROM inboxes WHERE id = ? AND organisation_id = ? AND status = 'active'").bind(inboxId, organisationId).first();
  if (!inbox) return jsonError(c, 404, 'inbox_not_found', 'Inbox not found.');

  const includeContent = c.req.query('include') === 'content';
  const requestedLimit = Number(c.req.query('limit') ?? 50);
  if (includeContent && requestedLimit !== 1) return jsonError(c, 422, 'invalid_include', 'include=content requires limit=1.');
  if (c.req.query('received_after') && !Number.isFinite(Date.parse(c.req.query('received_after')!))) {
    return jsonError(c, 422, 'invalid_received_after', 'received_after must be an RFC 3339 timestamp.');
  }
  const waitSeconds = Math.max(0, Math.min(Number(c.req.query('wait_seconds') ?? 0) || 0, 180));
  const queryValues = {
    limit: c.req.query('limit'),
    subject: c.req.query('subject'),
    sender: c.req.query('sender'),
    sender_domain: c.req.query('sender_domain'),
    received_after: c.req.query('received_after'),
  };

  let pollId: string | null = null;
  if (waitSeconds > 0) {
    const now = Date.now();
    await c.env.DB.prepare('DELETE FROM long_polls WHERE expires_at <= ?').bind(now).run();
    const counts = await c.env.DB.prepare(
      'SELECT SUM(CASE WHEN organisation_id = ? THEN 1 ELSE 0 END) AS org_count, SUM(CASE WHEN api_key_id = ? THEN 1 ELSE 0 END) AS key_count FROM long_polls',
    )
      .bind(organisationId, keyId)
      .first<{ org_count: number | null; key_count: number | null }>();
    if ((counts?.org_count ?? 0) >= 30 || (counts?.key_count ?? 0) >= 10) {
      return jsonError(c, 429, 'long_poll_limit_exceeded', 'Concurrent long-poll limit exceeded.');
    }
    pollId = randomId('poll');
    await c.env.DB.prepare('INSERT INTO long_polls (id, organisation_id, api_key_id, expires_at) VALUES (?, ?, ?, ?)')
      .bind(pollId, organisationId, keyId, now + waitSeconds * 1000 + 5000)
      .run();
  }

  try {
    const deadline = Date.now() + waitSeconds * 1000;
    do {
      const result = await findMessages(c.env, organisationId, inboxId, queryValues);
      if (result.rows.length > 0) {
        const data = includeContent ? await Promise.all(result.rows.map((row) => messageContent(c.env, row))) : result.rows.map(messageSummary);
        return c.json({ data, next_cursor: null });
      }
      if (Date.now() >= deadline) break;
      await sleep(Math.min(1500, Math.max(0, deadline - Date.now())));
    } while (Date.now() <= deadline);
    return c.body(null, 204);
  } finally {
    if (pollId) c.executionCtx.waitUntil(c.env.DB.prepare('DELETE FROM long_polls WHERE id = ?').bind(pollId).run());
  }
});

app.get('/v1/messages/:id', async (c) => {
  const row = await c.env.DB.prepare('SELECT * FROM messages WHERE id = ? AND organisation_id = ?')
    .bind(c.req.param('id'), c.get('auth').organisationId)
    .first<MessageRow>();
  if (!row) return jsonError(c, 404, 'message_not_found', 'Message not found.');
  return c.json({ data: await messageContent(c.env, row) });
});

app.delete('/v1/messages/:id', async (c) => {
  const { organisationId } = c.get('auth');
  const id = c.req.param('id');
  const keys = await objectKeysForMessage(c.env.DB, organisationId, id);
  if (keys.length === 0) {
    const exists = await c.env.DB.prepare('SELECT id FROM messages WHERE id = ? AND organisation_id = ?').bind(id, organisationId).first();
    if (!exists) return jsonError(c, 404, 'message_not_found', 'Message not found.');
  }
  await Promise.all(keys.map((key) => c.env.MAIL.delete(key)));
  await c.env.DB.batch([
    c.env.DB.prepare('DELETE FROM attachments WHERE message_id = ? AND organisation_id = ?').bind(id, organisationId),
    c.env.DB.prepare('DELETE FROM messages WHERE id = ? AND organisation_id = ?').bind(id, organisationId),
  ]);
  return c.body(null, 204);
});

app.get('/v1/attachments/:id', async (c) => {
  const attachment = await c.env.DB.prepare('SELECT * FROM attachments WHERE id = ? AND organisation_id = ?')
    .bind(c.req.param('id'), c.get('auth').organisationId)
    .first<AttachmentRow>();
  if (!attachment) return jsonError(c, 404, 'attachment_not_found', 'Attachment not found.');
  const object = await c.env.MAIL.get(attachment.object_key);
  if (!object) return jsonError(c, 404, 'attachment_not_found', 'Attachment content is no longer available.');
  const safeName = attachment.filename.replace(/["\r\n]/g, '_');
  return new Response(object.body, {
    headers: {
      'Content-Type': attachment.content_type || 'application/octet-stream',
      'Content-Length': String(attachment.size_bytes),
      'Content-Disposition': `attachment; filename="${safeName}"`,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-store',
    },
  });
});

app.get('/v1/usage', async (c) => {
  const { organisationId } = c.get('auth');
  const period = currentPeriod();
  const [inboxes, usage] = await Promise.all([
    c.env.DB.prepare("SELECT COUNT(*) AS count FROM inboxes WHERE organisation_id = ? AND status = 'active'").bind(organisationId).first<{ count: number }>(),
    c.env.DB.prepare('SELECT received_count FROM usage_counters WHERE organisation_id = ? AND period_start = ?')
      .bind(organisationId, period.key)
      .first<{ received_count: number }>(),
  ]);
  const active = inboxes?.count ?? 0;
  const received = usage?.received_count ?? 0;
  return c.json({
    plan: 'free',
    period: { starts_at: period.startsAt.toISOString(), ends_at: period.endsAt.toISOString() },
    inboxes: { active, limit: FREE_INBOX_LIMIT, remaining: Math.max(0, FREE_INBOX_LIMIT - active) },
    emails: { received, limit: FREE_EMAIL_LIMIT, remaining: Math.max(0, FREE_EMAIL_LIMIT - received) },
  });
});

function mailbox(address: Address | undefined) {
  if (!address || 'group' in address) return { name: '', address: '' };
  return { name: address.name ?? '', address: address.address.toLowerCase() };
}

async function receiveEmail(message: ForwardableEmailMessage, env: Env) {
  const recipient = message.to.trim().toLowerCase();
  const inbox = await env.DB.prepare("SELECT id, organisation_id FROM inboxes WHERE address = ? AND status = 'active'")
    .bind(recipient)
    .first<{ id: string; organisation_id: string }>();
  if (!inbox) {
    message.setReject('Recipient address rejected');
    return;
  }

  const period = currentPeriod();
  const usage = await env.DB.prepare('SELECT received_count FROM usage_counters WHERE organisation_id = ? AND period_start = ?')
    .bind(inbox.organisation_id, period.key)
    .first<{ received_count: number }>();
  if ((usage?.received_count ?? 0) >= FREE_EMAIL_LIMIT) {
    message.setReject('Monthly recipient quota exceeded');
    return;
  }

  const parsed = await PostalMime.parse(message.raw, { attachmentEncoding: 'arraybuffer', maxNestingDepth: 20, maxHeadersSize: 128 * 1024 });
  const now = Date.now();
  const messageId = randomId('msg');
  const sender = mailbox(parsed.from);
  const text = parsed.text ?? '';
  const html = parsed.html ?? '';
  const textObjectKey = text ? `messages/${inbox.organisation_id}/${messageId}/text.txt` : null;
  const htmlObjectKey = html ? `messages/${inbox.organisation_id}/${messageId}/html.html` : null;
  const attachmentRows: Array<AttachmentRow & { bytes: Uint8Array }> = parsed.attachments.map((attachment, index) => {
    const bytes = contentBytes(attachment.content);
    const id = randomId('att');
    return {
      id,
      message_id: messageId,
      filename: attachment.filename || `attachment-${index + 1}`,
      content_type: attachment.mimeType || 'application/octet-stream',
      size_bytes: bytes.byteLength,
      object_key: `messages/${inbox.organisation_id}/${messageId}/attachments/${id}`,
      disposition: attachment.disposition ?? 'attachment',
      content_id: attachment.contentId ?? null,
      bytes,
    };
  });

  const writes: Promise<unknown>[] = [];
  if (textObjectKey) writes.push(env.MAIL.put(textObjectKey, text, { httpMetadata: { contentType: 'text/plain; charset=utf-8' } }));
  if (htmlObjectKey) writes.push(env.MAIL.put(htmlObjectKey, html, { httpMetadata: { contentType: 'text/html; charset=utf-8' } }));
  for (const attachment of attachmentRows) {
    writes.push(env.MAIL.put(attachment.object_key, attachment.bytes, { httpMetadata: { contentType: attachment.content_type } }));
  }
  await Promise.all(writes);

  const statements = [
    env.DB.prepare(
      `INSERT INTO messages
       (id, organisation_id, inbox_id, internet_message_id, sender_email, sender_name, recipient, subject, preview, headers_json,
        text_object_key, html_object_key, size_bytes, received_at, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      messageId,
      inbox.organisation_id,
      inbox.id,
      parsed.messageId ?? null,
      sender.address || message.from.toLowerCase(),
      sender.name,
      recipient,
      parsed.subject ?? '',
      cleanPreview(text || parsed.subject || ''),
      JSON.stringify(parsed.headers.map((header) => [header.originalKey, header.value])),
      textObjectKey,
      htmlObjectKey,
      message.rawSize,
      now,
      now + RETENTION_MS,
    ),
    env.DB.prepare(
      `INSERT INTO usage_counters (organisation_id, period_start, received_count) VALUES (?, ?, 1)
       ON CONFLICT(organisation_id, period_start) DO UPDATE SET received_count = received_count + 1`,
    ).bind(inbox.organisation_id, period.key),
  ];
  for (const attachment of attachmentRows) {
    statements.push(
      env.DB.prepare(
        'INSERT INTO attachments (id, organisation_id, message_id, filename, content_type, size_bytes, object_key, disposition, content_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ).bind(
        attachment.id,
        inbox.organisation_id,
        messageId,
        attachment.filename,
        attachment.content_type,
        attachment.size_bytes,
        attachment.object_key,
        attachment.disposition,
        attachment.content_id,
      ),
    );
  }

  try {
    await env.DB.batch(statements);
  } catch (error) {
    await Promise.all([textObjectKey, htmlObjectKey, ...attachmentRows.map((row) => row.object_key)].filter((key): key is string => Boolean(key)).map((key) => env.MAIL.delete(key)));
    throw error;
  }
}

async function cleanup(env: Env) {
  const now = Date.now();
  const expired = await env.DB.prepare('SELECT id, organisation_id FROM messages WHERE expires_at <= ? LIMIT 500').bind(now).all<{
    id: string;
    organisation_id: string;
  }>();
  for (const message of expired.results) {
    const keys = await objectKeysForMessage(env.DB, message.organisation_id, message.id);
    await Promise.all(keys.map((key) => env.MAIL.delete(key)));
  }
  if (expired.results.length) {
    const placeholders = expired.results.map(() => '?').join(',');
    const ids = expired.results.map((row) => row.id);
    await env.DB.batch([
      env.DB.prepare(`DELETE FROM attachments WHERE message_id IN (${placeholders})`).bind(...ids),
      env.DB.prepare(`DELETE FROM messages WHERE id IN (${placeholders})`).bind(...ids),
    ]);
  }
  await env.DB.batch([
    env.DB.prepare("DELETE FROM inboxes WHERE status = 'deleted' AND quarantine_until <= ?").bind(now),
    env.DB.prepare('DELETE FROM idempotency_keys WHERE expires_at <= ?').bind(now),
    env.DB.prepare('DELETE FROM rate_limits WHERE expires_at <= ?').bind(now),
    env.DB.prepare('DELETE FROM long_polls WHERE expires_at <= ?').bind(now),
    env.DB.prepare('DELETE FROM audit_events WHERE expires_at <= ?').bind(now),
  ]);
}

export default {
  fetch: app.fetch,
  email: receiveEmail,
  scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(cleanup(env));
  },
} satisfies ExportedHandler<Env>;
