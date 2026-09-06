import { Hono } from 'hono';
import { cors } from 'hono/cors';
import PostalMime, { type Address } from 'postal-mime';
import { apiAuth } from './auth';
import { consoleApp } from './console';
import { createEmailRoute, deleteEmailRoute, EmailRoutingError } from './email-routing';
import type { AttachmentRow, Env, InboxRow, MessageRow, Variables } from './types';
import {
  cleanPreview,
  contentBytes,
  currentPeriod,
  AUDIT_RETENTION_MS,
  FREE_EMAIL_LIMIT,
  FREE_INBOX_LIMIT,
  generatedPrefix,
  IDEMPOTENCY_MS,
  jsonError,
  normalizePrefix,
  parseLimit,
  parseRfc3339,
  parseWaitSeconds,
  randomId,
  randomToken,
  RETENTION_MS,
  sha256,
  sleep,
  timingSafeEqual,
  toIso,
} from './utils';

export const app = new Hono<{ Bindings: Env; Variables: Variables }>();

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
    c.env.DB.prepare('INSERT INTO domains (id, name, active, created_at) VALUES (?, ?, 1, ?)').bind('dom_test', c.env.INBOX_DOMAIN, now),
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

app.route('/console', consoleApp);

app.use('/v1/*', apiAuth);

function encodeCursor(createdAt: number, id: string) {
  return btoa(`${createdAt}:${id}`);
}

type ParsedCursor = { value: { createdAt: number; id: string } | null } | { error: string };

function decodeCursor(value: string | undefined): ParsedCursor {
  if (!value) return { value: null };
  try {
    const [createdAt, id] = atob(value).split(':');
    const timestamp = Number(createdAt);
    if (!Number.isFinite(timestamp) || !id) return { error: 'cursor is invalid or malformed.' };
    return { value: { createdAt: timestamp, id } };
  } catch {
    return { error: 'cursor is invalid or malformed.' };
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

  let body: Record<string, unknown> = {};
  const rawBody = await c.req.text();
  if (rawBody.trim()) {
    try {
      const parsed = JSON.parse(rawBody) as unknown;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not an object');
      body = parsed as Record<string, unknown>;
    } catch {
      return jsonError(c, 422, 'invalid_json', 'Request body must be a valid JSON object.');
    }
  }
  const unknownProperties = Object.keys(body).filter((key) => key !== 'prefix');
  if (unknownProperties.length > 0) {
    return jsonError(c, 422, 'unknown_property', `Unknown request property: ${unknownProperties[0]}.`);
  }
  const normalizedPrefix = body.prefix === undefined ? null : normalizePrefix(body.prefix);
  if (body.prefix !== undefined && normalizedPrefix === null) {
    return jsonError(c, 422, 'invalid_prefix', 'Prefix must be 3–40 letters, digits or hyphens and cannot be reserved.');
  }

  const now = Date.now();
  const requestHash = await sha256(JSON.stringify({ prefix: normalizedPrefix }));
  if (idempotencyKey) {
    await c.env.DB.prepare('DELETE FROM idempotency_keys WHERE organisation_id = ? AND key = ? AND expires_at <= ?')
      .bind(organisationId, idempotencyKey, now)
      .run();
    const reservation = await c.env.DB.prepare(
      "INSERT OR IGNORE INTO idempotency_keys (organisation_id, key, response_json, request_hash, created_at, expires_at) VALUES (?, ?, '__pending__', ?, ?, ?)",
    )
      .bind(organisationId, idempotencyKey, requestHash, now, now + IDEMPOTENCY_MS)
      .run();
    if ((reservation.meta.changes ?? 0) === 0) {
      const cached = await c.env.DB.prepare(
        'SELECT response_json, request_hash FROM idempotency_keys WHERE organisation_id = ? AND key = ? AND expires_at > ?',
      )
        .bind(organisationId, idempotencyKey, now)
        .first<{ response_json: string; request_hash: string | null }>();
      if (!cached) return jsonError(c, 503, 'idempotency_unavailable', 'The idempotent request could not be resolved. Please retry.');
      if (cached.request_hash && cached.request_hash !== requestHash) {
        return jsonError(c, 409, 'idempotency_key_reused', 'Idempotency-Key was already used with a different request body.');
      }
      if (cached.response_json === '__pending__') {
        c.header('Retry-After', '1');
        return jsonError(c, 409, 'idempotency_in_progress', 'A request with this Idempotency-Key is still in progress.');
      }
      return c.json(JSON.parse(cached.response_json), 201);
    }
  }

  const releaseIdempotency = async () => {
    if (idempotencyKey) {
      await c.env.DB.prepare("DELETE FROM idempotency_keys WHERE organisation_id = ? AND key = ? AND response_json = '__pending__'")
        .bind(organisationId, idempotencyKey)
        .run();
    }
  };

  let localPart = normalizedPrefix ?? generatedPrefix();
  let address = `${localPart}@${c.env.INBOX_DOMAIN}`;
  const row: InboxRow = {
    id: randomId('inbox'),
    organisation_id: organisationId,
    local_part: localPart,
    address,
    status: 'provisioning',
    routing_rule_id: null,
    created_at: now,
    deleted_at: null,
  };

  let reserved = false;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    row.local_part = localPart;
    row.address = address;
    try {
      const result = await c.env.DB.prepare(
        `INSERT INTO inboxes (id, organisation_id, domain_id, local_part, address, routing_rule_id, status, created_at)
         SELECT ?, ?, 'dom_test', ?, ?, NULL, 'provisioning', ?
         WHERE (SELECT COUNT(*) FROM inboxes WHERE organisation_id = ? AND status IN ('active', 'provisioning')) < ?`,
      )
        .bind(row.id, organisationId, localPart, address, now, organisationId, FREE_INBOX_LIMIT)
        .run();
      if ((result.meta.changes ?? 0) === 0) {
        await releaseIdempotency();
        return jsonError(c, 409, 'inbox_quota_exceeded', 'Active inbox quota exceeded.');
      }
      reserved = true;
      break;
    } catch (error) {
      const isAddressConflict = error instanceof Error && /UNIQUE constraint failed: inboxes\.address/i.test(error.message);
      if (!isAddressConflict) {
        await releaseIdempotency();
        throw error;
      }
      if (normalizedPrefix !== null) {
        await releaseIdempotency();
        return jsonError(c, 409, 'address_unavailable', 'That inbox address is unavailable.');
      }
      localPart = generatedPrefix();
      address = `${localPart}@${c.env.INBOX_DOMAIN}`;
    }
  }
  if (!reserved) {
    await releaseIdempotency();
    return jsonError(c, 503, 'address_generation_failed', 'A unique inbox address could not be generated. Please retry.');
  }

  row.status = 'active';
  const response = { data: inboxJson(row) };
  let routingRuleId: string;
  try {
    routingRuleId = await createEmailRoute(c.env, address);
    row.routing_rule_id = routingRuleId;
  } catch (error) {
    await c.env.DB.prepare("DELETE FROM inboxes WHERE id = ? AND status = 'provisioning'").bind(row.id).run();
    await releaseIdempotency();
    console.error(JSON.stringify({ request_id: c.get('requestId'), event: 'email_route_create_failed', address, error: error instanceof Error ? error.message : 'unknown' }));
    const status = error instanceof EmailRoutingError && error.status === 503 ? 503 : 502;
    return jsonError(c, status, 'email_routing_unavailable', 'The inbox mail route could not be created. Please retry.');
  }
  const statements = [
    c.env.DB.prepare("UPDATE inboxes SET routing_rule_id = ?, status = 'active' WHERE id = ? AND status = 'provisioning'").bind(routingRuleId, row.id),
    c.env.DB.prepare('INSERT INTO audit_events (id, organisation_id, actor_id, action, target_id, request_id, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(
      randomId('audit'), organisationId, c.get('auth').keyId, 'inbox.created', row.id, c.get('requestId'), now, now + AUDIT_RETENTION_MS,
    ),
  ];
  if (idempotencyKey) {
    statements.push(
      c.env.DB.prepare("UPDATE idempotency_keys SET response_json = ?, request_hash = ? WHERE organisation_id = ? AND key = ? AND response_json = '__pending__'").bind(
        JSON.stringify(response),
        requestHash,
        organisationId,
        idempotencyKey,
      ),
    );
  }
  try {
    await c.env.DB.batch(statements);
  } catch (error) {
    await deleteEmailRoute(c.env, address, routingRuleId).catch((cleanupError) =>
      console.error(JSON.stringify({ request_id: c.get('requestId'), event: 'email_route_rollback_failed', address, error: cleanupError instanceof Error ? cleanupError.message : 'unknown' })),
    );
    await c.env.DB.prepare("DELETE FROM inboxes WHERE id = ? AND status = 'provisioning'").bind(row.id).run();
    await releaseIdempotency();
    throw error;
  }
  return c.json(response, 201);
});

app.get('/v1/inboxes', async (c) => {
  const { organisationId } = c.get('auth');
  const parsedLimit = parseLimit(c.req.query('limit'));
  if ('error' in parsedLimit) return jsonError(c, 422, 'invalid_limit', parsedLimit.error);
  const limit = parsedLimit.value;
  const parsedCursor = decodeCursor(c.req.query('cursor'));
  if ('error' in parsedCursor) return jsonError(c, 422, 'invalid_cursor', parsedCursor.error);
  const cursor = parsedCursor.value;
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
  try {
    await deleteEmailRoute(c.env, inbox.address, inbox.routing_rule_id);
  } catch (error) {
    console.error(JSON.stringify({ request_id: c.get('requestId'), event: 'email_route_delete_failed', address: inbox.address, error: error instanceof Error ? error.message : 'unknown' }));
    const status = error instanceof EmailRoutingError && error.status === 503 ? 503 : 502;
    return jsonError(c, status, 'email_routing_unavailable', 'The inbox mail route could not be removed. Please retry.');
  }
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
    c.env.DB.prepare('INSERT INTO audit_events (id, organisation_id, actor_id, action, target_id, request_id, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(
      randomId('audit'), organisationId, c.get('auth').keyId, 'inbox.deleted', inbox.id, c.get('requestId'), now, now + AUDIT_RETENTION_MS,
    ),
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
  const parsedLimit = parseLimit(queryValues.limit);
  if ('error' in parsedLimit) throw new Error('findMessages called without validated limit');
  const limit = parsedLimit.value;
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
    clauses.push('m.received_at >= ?');
    values.push(parseRfc3339(queryValues.received_after));
  }
  const parsedCursor = decodeCursor(queryValues.cursor);
  if ('error' in parsedCursor) throw new Error('findMessages called without validated cursor');
  if (parsedCursor.value) {
    clauses.push('(m.received_at < ? OR (m.received_at = ? AND m.id < ?))');
    values.push(parsedCursor.value.createdAt, parsedCursor.value.createdAt, parsedCursor.value.id);
  }
  const sql = `SELECT m.* FROM messages m WHERE ${clauses.join(' AND ')} ORDER BY m.received_at DESC, m.id DESC LIMIT ?`;
  values.push(limit + 1);
  const result = await env.DB.prepare(sql).bind(...values).all<MessageRow>();
  const rows = result.results.slice(0, limit);
  const next = result.results.length > limit ? rows.at(-1) : null;
  return { rows, nextCursor: next ? encodeCursor(next.received_at, next.id) : null };
}

app.get('/v1/inboxes/:id/messages', async (c) => {
  const { organisationId, keyId } = c.get('auth');
  const inboxId = c.req.param('id');
  const inbox = await c.env.DB.prepare("SELECT id FROM inboxes WHERE id = ? AND organisation_id = ? AND status = 'active'").bind(inboxId, organisationId).first();
  if (!inbox) return jsonError(c, 404, 'inbox_not_found', 'Inbox not found.');

  const include = c.req.query('include');
  if (include !== undefined && include !== 'content') return jsonError(c, 422, 'invalid_include', 'include must be content when supplied.');
  const includeContent = include === 'content';
  const parsedLimit = parseLimit(c.req.query('limit'));
  if ('error' in parsedLimit) return jsonError(c, 422, 'invalid_limit', parsedLimit.error);
  if (includeContent && parsedLimit.value !== 1) return jsonError(c, 422, 'invalid_include', 'include=content requires limit=1.');
  const receivedAfter = c.req.query('received_after');
  if (receivedAfter && parseRfc3339(receivedAfter) === null) {
    return jsonError(c, 422, 'invalid_received_after', 'received_after must be an RFC 3339 timestamp.');
  }
  const parsedWait = parseWaitSeconds(c.req.query('wait_seconds'));
  if ('error' in parsedWait) return jsonError(c, 422, 'invalid_wait_seconds', parsedWait.error);
  const waitSeconds = parsedWait.value;
  const parsedCursor = decodeCursor(c.req.query('cursor'));
  if ('error' in parsedCursor) return jsonError(c, 422, 'invalid_cursor', parsedCursor.error);
  const sender = c.req.query('sender');
  if (sender && !/^[^@\s]+@[^@\s]+$/.test(sender)) return jsonError(c, 422, 'invalid_sender', 'sender must be an email address.');
  const senderDomain = c.req.query('sender_domain');
  if (senderDomain && (senderDomain.includes('@') || /\s/.test(senderDomain))) {
    return jsonError(c, 422, 'invalid_sender_domain', 'sender_domain must be a domain name.');
  }
  const queryValues = {
    limit: String(parsedLimit.value),
    cursor: c.req.query('cursor'),
    subject: c.req.query('subject'),
    sender,
    sender_domain: senderDomain,
    received_after: receivedAfter,
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
        return c.json({ data, next_cursor: result.nextCursor });
      }
      if (waitSeconds === 0) return c.json({ data: [], next_cursor: null });
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
  const now = Date.now();
  await c.env.DB.batch([
    c.env.DB.prepare('DELETE FROM attachments WHERE message_id = ? AND organisation_id = ?').bind(id, organisationId),
    c.env.DB.prepare('DELETE FROM messages WHERE id = ? AND organisation_id = ?').bind(id, organisationId),
    c.env.DB.prepare('INSERT INTO audit_events (id, organisation_id, actor_id, action, target_id, request_id, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(
      randomId('audit'), organisationId, c.get('auth').keyId, 'message.deleted', id, c.get('requestId'), now, now + AUDIT_RETENTION_MS,
    ),
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
  const safeName = attachment.filename.replace(/["\\\r\n]/g, '_');
  const encodedName = encodeURIComponent(attachment.filename).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return new Response(object.body, {
    headers: {
      'Content-Type': attachment.content_type || 'application/octet-stream',
      'Content-Length': String(attachment.size_bytes),
      'Content-Disposition': `attachment; filename="${safeName}"; filename*=UTF-8''${encodedName}`,
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

export async function receiveEmail(message: ForwardableEmailMessage, env: Env) {
  const recipient = message.to.trim().toLowerCase();
  const inbox = await env.DB.prepare("SELECT id, organisation_id FROM inboxes WHERE address = ? AND status = 'active'")
    .bind(recipient)
    .first<{ id: string; organisation_id: string }>();
  if (!inbox) {
    message.setReject('Recipient address rejected');
    return;
  }

  const period = currentPeriod();
  const reservation = await env.DB.prepare(
    `INSERT INTO usage_counters (organisation_id, period_start, received_count) VALUES (?, ?, 1)
     ON CONFLICT(organisation_id, period_start) DO UPDATE SET received_count = received_count + 1
     WHERE received_count < ?`,
  )
    .bind(inbox.organisation_id, period.key, FREE_EMAIL_LIMIT)
    .run();
  if ((reservation.meta.changes ?? 0) === 0) {
    message.setReject('Monthly recipient quota exceeded');
    return;
  }

  try {
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
        disposition: attachment.disposition === 'inline' ? 'inline' : 'attachment',
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
      await Promise.all(writes);
      await env.DB.batch(statements);
    } catch (error) {
      await Promise.all([textObjectKey, htmlObjectKey, ...attachmentRows.map((row) => row.object_key)].filter((key): key is string => Boolean(key)).map((key) => env.MAIL.delete(key)));
      throw error;
    }
  } catch (error) {
    await env.DB.prepare('UPDATE usage_counters SET received_count = MAX(0, received_count - 1) WHERE organisation_id = ? AND period_start = ?')
      .bind(inbox.organisation_id, period.key)
      .run();
    throw error;
  }
}

export async function cleanup(env: Env) {
  const now = Date.now();
  let expiredCount: number;
  do {
    const expired = await env.DB.prepare('SELECT id FROM messages WHERE expires_at <= ? ORDER BY expires_at, id LIMIT 500').bind(now).all<{ id: string }>();
    expiredCount = expired.results.length;
    if (expiredCount > 0) {
      const objects = await env.DB.prepare(
        `WITH expired AS (SELECT id FROM messages WHERE expires_at <= ? ORDER BY expires_at, id LIMIT 500)
         SELECT text_object_key AS object_key FROM messages WHERE id IN (SELECT id FROM expired) AND text_object_key IS NOT NULL
         UNION ALL SELECT html_object_key FROM messages WHERE id IN (SELECT id FROM expired) AND html_object_key IS NOT NULL
         UNION ALL SELECT object_key FROM attachments WHERE message_id IN (SELECT id FROM expired)`,
      )
        .bind(now)
        .all<{ object_key: string }>();
      for (let offset = 0; offset < objects.results.length; offset += 1000) {
        await env.MAIL.delete(objects.results.slice(offset, offset + 1000).map((row) => row.object_key));
      }
      await env.DB.batch([
        env.DB.prepare(
          'DELETE FROM attachments WHERE message_id IN (SELECT id FROM messages WHERE expires_at <= ? ORDER BY expires_at, id LIMIT 500)',
        ).bind(now),
        env.DB.prepare('DELETE FROM messages WHERE id IN (SELECT id FROM messages WHERE expires_at <= ? ORDER BY expires_at, id LIMIT 500)').bind(now),
      ]);
    }
  } while (expiredCount === 500);
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
