import { Hono } from 'hono';
import { verifyFirebaseIdToken } from './firebase-auth';
import { consoleAuth, requireOwner, requireRecentAuth, requireVerifiedEmail } from './console-auth';
import { createEmailRoute, deleteEmailRoute, EmailRoutingError } from './email-routing';
import { verifyTurnstile } from './turnstile';
import type { AttachmentRow, Env, InboxRow, MessageRow, Variables } from './types';
import {
  AUDIT_RETENTION_MS,
  currentPeriod,
  FREE_EMAIL_LIMIT,
  FREE_INBOX_LIMIT,
  generatedPrefix,
  jsonError,
  normalizePrefix,
  parseLimit,
  randomId,
  randomToken,
  RETENTION_MS,
  sha256,
  toIso,
} from './utils';

export const consoleApp = new Hono<{ Bindings: Env; Variables: Variables }>();

consoleApp.use('*', async (c, next) => {
  c.header('Cache-Control', 'private, no-store');
  await next();
});

async function consumeRateLimit(db: D1Database, scope: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = String(Math.floor(now / windowMs));
  const expiresAt = now + windowMs + 60_000;
  await db
    .prepare(
      `INSERT INTO rate_limits (scope, bucket, count, expires_at) VALUES (?, ?, 1, ?)
       ON CONFLICT(scope, bucket) DO UPDATE SET count = count + 1`,
    )
    .bind(scope, bucket, expiresAt)
    .run();
  const row = await db.prepare('SELECT count FROM rate_limits WHERE scope = ? AND bucket = ?').bind(scope, bucket).first<{ count: number }>();
  return (row?.count ?? limit + 1) <= limit;
}

function isBlockedSignupEmail(email: string, inboxDomain: string) {
  const normalized = email.trim().toLowerCase();
  return normalized.endsWith(`@${inboxDomain.toLowerCase()}`) || normalized.endsWith('@test.inboxrhino.in');
}

function organisationName(email: string, displayName?: string) {
  if (displayName?.trim()) return `${displayName.trim()}'s organisation`;
  const local = email.split('@')[0]?.trim();
  return local ? `${local}'s organisation` : 'My organisation';
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
    })),
  };
}

consoleApp.post('/session', async (c) => {
  if (!c.env.FIREBASE_PROJECT_ID) return jsonError(c, 503, 'auth_unavailable', 'Authentication is not configured.');

  let body: { id_token?: string; turnstile_token?: string };
  try {
    body = (await c.req.json()) as { id_token?: string; turnstile_token?: string };
  } catch {
    return jsonError(c, 422, 'invalid_json', 'Request body must be valid JSON.');
  }

  const idToken = body.id_token?.trim();
  const turnstileToken = body.turnstile_token?.trim();
  if (!idToken) return jsonError(c, 422, 'invalid_request', 'id_token is required.');

  const remoteIp = c.req.header('CF-Connecting-IP') ?? c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() ?? null;

  let claims;
  try {
    claims = await verifyFirebaseIdToken(idToken, c.env.FIREBASE_PROJECT_ID);
  } catch {
    if (remoteIp) await consumeRateLimit(c.env.DB, `auth-fail:ip:${remoteIp}`, 10, 15 * 60 * 1000);
    return jsonError(c, 401, 'invalid_token', 'The authentication token is invalid or expired.');
  }

  if (isBlockedSignupEmail(claims.email, c.env.INBOX_DOMAIN)) {
    return jsonError(c, 403, 'signup_forbidden', 'Addresses on InboxRhino test domains cannot be used to register.');
  }

  const now = Date.now();
  const existingUser = await c.env.DB.prepare('SELECT id FROM users WHERE firebase_uid = ?').bind(claims.sub).first<{ id: string }>();
  const isNewUser = !existingUser;

  if (isNewUser) {
    if (!turnstileToken) return jsonError(c, 422, 'invalid_request', 'turnstile_token is required for new accounts.');
    const turnstileOk = await verifyTurnstile(c.env.TURNSTILE_SECRET_KEY, turnstileToken, remoteIp);
    if (!turnstileOk) return jsonError(c, 403, 'turnstile_failed', 'Human verification failed. Please try again.');
  }

  if (isNewUser && remoteIp) {
    const allowed = await consumeRateLimit(c.env.DB, `signup:ip:${remoteIp}`, 5, 60 * 60 * 1000);
    if (!allowed) return jsonError(c, 429, 'signup_rate_limited', 'Too many sign-ups from this network. Try again later.');
  }

  let userId = existingUser?.id;
  if (!userId) {
    userId = randomId('user');
    await c.env.DB.prepare(
      'INSERT INTO users (id, firebase_uid, email, email_verified, display_name, created_at, last_login_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    )
      .bind(userId, claims.sub, claims.email.toLowerCase(), claims.email_verified ? 1 : 0, claims.name ?? null, now, now)
      .run();
  } else {
    await c.env.DB.prepare('UPDATE users SET email = ?, email_verified = ?, display_name = ?, last_login_at = ? WHERE id = ?')
      .bind(claims.email.toLowerCase(), claims.email_verified ? 1 : 0, claims.name ?? null, now, userId)
      .run();
  }

  let membership = await c.env.DB.prepare(
    'SELECT organisation_id, role FROM organisation_members WHERE user_id = ? LIMIT 1',
  )
    .bind(userId)
    .first<{ organisation_id: string; role: 'owner' | 'member' }>();

  if (!membership) {
    const organisationId = randomId('org');
    const country = c.req.header('CF-IPCountry') ?? null;
    const period = currentPeriod();
    await c.env.DB.batch([
      c.env.DB.prepare('INSERT INTO organisations (id, name, plan, signup_country, created_at) VALUES (?, ?, ?, ?, ?)').bind(
        organisationId,
        organisationName(claims.email, claims.name),
        'free',
        country,
        now,
      ),
      c.env.DB.prepare('INSERT INTO organisation_members (organisation_id, user_id, role, joined_at) VALUES (?, ?, ?, ?)').bind(
        organisationId,
        userId,
        'owner',
        now,
      ),
      c.env.DB.prepare('INSERT OR IGNORE INTO domains (id, name, active, created_at) VALUES (?, ?, 1, ?)').bind(
        'dom_test',
        c.env.INBOX_DOMAIN,
        now,
      ),
      c.env.DB.prepare('INSERT OR IGNORE INTO usage_counters (organisation_id, period_start, received_count) VALUES (?, ?, 0)').bind(
        organisationId,
        period.key,
      ),
    ]);
    membership = { organisation_id: organisationId, role: 'owner' };
  }

  const organisation = await c.env.DB.prepare('SELECT id, name, plan FROM organisations WHERE id = ?')
    .bind(membership.organisation_id)
    .first<{ id: string; name: string; plan: string }>();

  return c.json({
    user: {
      id: userId,
      email: claims.email.toLowerCase(),
      display_name: claims.name ?? null,
      email_verified: claims.email_verified,
    },
    organisation,
    role: membership.role,
  });
});

consoleApp.use('/*', consoleAuth);

consoleApp.get('/me', (c) => {
  const auth = c.get('consoleAuth');
  return c.env.DB.prepare('SELECT id, name, plan FROM organisations WHERE id = ?')
    .bind(auth.organisationId)
    .first<{ id: string; name: string; plan: string }>()
    .then((organisation) =>
      c.json({
        user: {
          id: auth.userId,
          email: auth.email,
          email_verified: auth.emailVerified,
        },
        organisation,
        role: auth.role,
      }),
    );
});

consoleApp.get('/api-keys', async (c) => {
  const denied = requireOwner(c);
  if (denied) return denied;
  const rows = await c.env.DB.prepare(
    'SELECT id, name, prefix, created_at, last_used_at FROM api_keys WHERE organisation_id = ? AND revoked_at IS NULL ORDER BY created_at DESC',
  )
    .bind(c.get('consoleAuth').organisationId)
    .all<{ id: string; name: string; prefix: string; created_at: number; last_used_at: number | null }>();
  return c.json({
    data: rows.results.map((row) => ({
      id: row.id,
      name: row.name,
      prefix: row.prefix,
      created_at: toIso(row.created_at),
      last_used_at: row.last_used_at ? toIso(row.last_used_at) : null,
    })),
  });
});

consoleApp.post('/api-keys', async (c) => {
  const denied = requireOwner(c) ?? requireVerifiedEmail(c) ?? requireRecentAuth(c);
  if (denied) return denied;

  let body: { name?: string };
  try {
    body = (await c.req.json()) as { name?: string };
  } catch {
    return jsonError(c, 422, 'invalid_json', 'Request body must be valid JSON.');
  }
  const name = body.name?.trim() || 'Console API key';
  if (name.length > 100) return jsonError(c, 422, 'invalid_name', 'API key name must be 100 characters or fewer.');

  const now = Date.now();
  const keyId = randomId('key');
  const publicId = randomToken(8);
  const apiKey = `ir_live_${publicId}_${randomToken(24)}`;
  const prefix = `ir_live_${publicId}`;
  const secretHash = await sha256(apiKey);
  const { organisationId, userId } = c.get('consoleAuth');

  await c.env.DB.batch([
    c.env.DB.prepare('INSERT INTO api_keys (id, organisation_id, name, prefix, secret_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)').bind(
      keyId,
      organisationId,
      name,
      prefix,
      secretHash,
      now,
    ),
    c.env.DB.prepare('INSERT INTO audit_events (id, organisation_id, actor_id, action, target_id, request_id, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(
      randomId('audit'),
      organisationId,
      userId,
      'api_key.created',
      keyId,
      c.get('requestId'),
      now,
      now + AUDIT_RETENTION_MS,
    ),
  ]);

  return c.json({ data: { id: keyId, name, prefix, api_key: apiKey, warning: 'This API key is shown only once.' } }, 201);
});

consoleApp.delete('/api-keys/:id', async (c) => {
  const denied = requireOwner(c) ?? requireRecentAuth(c);
  if (denied) return denied;

  const { organisationId, userId } = c.get('consoleAuth');
  const keyId = c.req.param('id');
  const now = Date.now();
  const result = await c.env.DB.prepare(
    'UPDATE api_keys SET revoked_at = ? WHERE id = ? AND organisation_id = ? AND revoked_at IS NULL',
  )
    .bind(now, keyId, organisationId)
    .run();
  if ((result.meta.changes ?? 0) === 0) return jsonError(c, 404, 'api_key_not_found', 'API key not found.');

  await c.env.DB.prepare('INSERT INTO audit_events (id, organisation_id, actor_id, action, target_id, request_id, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(
    randomId('audit'),
    organisationId,
    userId,
    'api_key.revoked',
    keyId,
    c.get('requestId'),
    now,
    now + AUDIT_RETENTION_MS,
  );
  return c.body(null, 204);
});

consoleApp.get('/usage', async (c) => {
  const denied = requireVerifiedEmail(c);
  if (denied) return denied;

  const { organisationId } = c.get('consoleAuth');
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

consoleApp.get('/inboxes', async (c) => {
  const denied = requireVerifiedEmail(c);
  if (denied) return denied;

  const parsedLimit = parseLimit(c.req.query('limit'));
  if ('error' in parsedLimit) return jsonError(c, 422, 'invalid_limit', parsedLimit.error);
  const limit = parsedLimit.value;
  const { organisationId } = c.get('consoleAuth');
  const result = await c.env.DB.prepare(
    "SELECT * FROM inboxes WHERE organisation_id = ? AND status = 'active' ORDER BY created_at DESC, id DESC LIMIT ?",
  )
    .bind(organisationId, limit)
    .all<InboxRow>();
  return c.json({ data: result.results.map(inboxJson) });
});

consoleApp.post('/inboxes', async (c) => {
  const denied = requireVerifiedEmail(c);
  if (denied) return denied;

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
  if (Object.keys(body).some((key) => key !== 'prefix')) {
    return jsonError(c, 422, 'unknown_property', 'Only prefix is supported in the request body.');
  }
  const normalizedPrefix = body.prefix === undefined ? null : normalizePrefix(body.prefix);
  if (body.prefix !== undefined && normalizedPrefix === null) {
    return jsonError(c, 422, 'invalid_prefix', 'Prefix must be 3–40 letters, digits or hyphens and cannot be reserved.');
  }

  const { organisationId, userId } = c.get('consoleAuth');
  const now = Date.now();
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
      if ((result.meta.changes ?? 0) === 0) return jsonError(c, 409, 'inbox_quota_exceeded', 'Active inbox quota exceeded.');
      reserved = true;
      break;
    } catch (error) {
      const isAddressConflict = error instanceof Error && /UNIQUE constraint failed: inboxes\.address/i.test(error.message);
      if (!isAddressConflict) throw error;
      if (normalizedPrefix !== null) return jsonError(c, 409, 'address_unavailable', 'That inbox address is unavailable.');
      localPart = generatedPrefix();
      address = `${localPart}@${c.env.INBOX_DOMAIN}`;
    }
  }
  if (!reserved) return jsonError(c, 503, 'address_generation_failed', 'A unique inbox address could not be generated. Please retry.');

  let routingRuleId: string;
  try {
    routingRuleId = await createEmailRoute(c.env, address);
  } catch (error) {
    await c.env.DB.prepare("DELETE FROM inboxes WHERE id = ? AND status = 'provisioning'").bind(row.id).run();
    const status = error instanceof EmailRoutingError && error.status === 503 ? 503 : 502;
    return jsonError(c, status, 'email_routing_unavailable', 'The inbox mail route could not be created. Please retry.');
  }

  row.routing_rule_id = routingRuleId;
  row.status = 'active';
  await c.env.DB.batch([
    c.env.DB.prepare("UPDATE inboxes SET routing_rule_id = ?, status = 'active' WHERE id = ? AND status = 'provisioning'").bind(routingRuleId, row.id),
    c.env.DB.prepare('INSERT INTO audit_events (id, organisation_id, actor_id, action, target_id, request_id, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(
      randomId('audit'),
      organisationId,
      userId,
      'inbox.created',
      row.id,
      c.get('requestId'),
      now,
      now + AUDIT_RETENTION_MS,
    ),
  ]);
  return c.json({ data: inboxJson(row) }, 201);
});

consoleApp.delete('/inboxes/:id', async (c) => {
  const denied = requireVerifiedEmail(c);
  if (denied) return denied;

  const { organisationId, userId } = c.get('consoleAuth');
  const inbox = await c.env.DB.prepare("SELECT * FROM inboxes WHERE id = ? AND organisation_id = ? AND status = 'active'")
    .bind(c.req.param('id'), organisationId)
    .first<InboxRow>();
  if (!inbox) return jsonError(c, 404, 'inbox_not_found', 'Inbox not found.');

  try {
    await deleteEmailRoute(c.env, inbox.address, inbox.routing_rule_id);
  } catch (error) {
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
      randomId('audit'),
      organisationId,
      userId,
      'inbox.deleted',
      inbox.id,
      c.get('requestId'),
      now,
      now + AUDIT_RETENTION_MS,
    ),
  ]);
  return c.body(null, 204);
});

consoleApp.get('/inboxes/:id/messages', async (c) => {
  const denied = requireVerifiedEmail(c);
  if (denied) return denied;

  const { organisationId } = c.get('consoleAuth');
  const inboxId = c.req.param('id');
  const inbox = await c.env.DB.prepare("SELECT id FROM inboxes WHERE id = ? AND organisation_id = ? AND status = 'active'").bind(inboxId, organisationId).first();
  if (!inbox) return jsonError(c, 404, 'inbox_not_found', 'Inbox not found.');

  const parsedLimit = parseLimit(c.req.query('limit'));
  if ('error' in parsedLimit) return jsonError(c, 422, 'invalid_limit', parsedLimit.error);
  const result = await c.env.DB.prepare(
    'SELECT * FROM messages WHERE organisation_id = ? AND inbox_id = ? ORDER BY received_at DESC, id DESC LIMIT ?',
  )
    .bind(organisationId, inboxId, parsedLimit.value)
    .all<MessageRow>();
  return c.json({ data: result.results.map(messageSummary) });
});

consoleApp.get('/messages/:id', async (c) => {
  const denied = requireVerifiedEmail(c);
  if (denied) return denied;

  const row = await c.env.DB.prepare('SELECT * FROM messages WHERE id = ? AND organisation_id = ?')
    .bind(c.req.param('id'), c.get('consoleAuth').organisationId)
    .first<MessageRow>();
  if (!row) return jsonError(c, 404, 'message_not_found', 'Message not found.');
  return c.json({ data: await messageContent(c.env, row) });
});

consoleApp.delete('/messages/:id', async (c) => {
  const denied = requireVerifiedEmail(c);
  if (denied) return denied;

  const { organisationId, userId } = c.get('consoleAuth');
  const id = c.req.param('id');
  const message = await c.env.DB.prepare('SELECT id FROM messages WHERE id = ? AND organisation_id = ?').bind(id, organisationId).first();
  if (!message) return jsonError(c, 404, 'message_not_found', 'Message not found.');

  const keys = await c.env.DB.prepare(
    `SELECT text_object_key AS object_key FROM messages WHERE id = ? AND text_object_key IS NOT NULL
     UNION ALL SELECT html_object_key FROM messages WHERE id = ? AND html_object_key IS NOT NULL
     UNION ALL SELECT object_key FROM attachments WHERE message_id = ?`,
  )
    .bind(id, id, id)
    .all<{ object_key: string }>();
  await Promise.all(keys.results.map((row) => c.env.MAIL.delete(row.object_key)));
  const now = Date.now();
  await c.env.DB.batch([
    c.env.DB.prepare('DELETE FROM attachments WHERE message_id = ? AND organisation_id = ?').bind(id, organisationId),
    c.env.DB.prepare('DELETE FROM messages WHERE id = ? AND organisation_id = ?').bind(id, organisationId),
    c.env.DB.prepare('INSERT INTO audit_events (id, organisation_id, actor_id, action, target_id, request_id, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(
      randomId('audit'),
      organisationId,
      userId,
      'message.deleted',
      id,
      c.get('requestId'),
      now,
      now + AUDIT_RETENTION_MS,
    ),
  ]);
  return c.body(null, 204);
});

consoleApp.get('/attachments/:id', async (c) => {
  const denied = requireVerifiedEmail(c);
  if (denied) return denied;

  const attachment = await c.env.DB.prepare('SELECT * FROM attachments WHERE id = ? AND organisation_id = ?')
    .bind(c.req.param('id'), c.get('consoleAuth').organisationId)
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
