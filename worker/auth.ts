import type { MiddlewareHandler } from 'hono';
import type { Env, Variables } from './types';
import { jsonError, sha256, timingSafeEqual } from './utils';

type KeyRow = {
  id: string;
  organisation_id: string;
  secret_hash: string;
  last_used_at: number | null;
};

async function consumeRateLimit(db: D1Database, scope: string, limit: number) {
  const now = Date.now();
  const bucket = new Date(now).toISOString().slice(0, 16);
  const expiresAt = now + 2 * 60 * 1000;
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

export const apiAuth: MiddlewareHandler<{ Bindings: Env; Variables: Variables }> = async (c, next) => {
  const authorization = c.req.header('Authorization') ?? '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  const match = /^ir_live_([a-f0-9]{16})_([a-f0-9]{48})$/.exec(token);
  if (!match) return jsonError(c, 401, 'invalid_api_key', 'A valid Bearer API key is required.');

  const prefix = `ir_live_${match[1]}`;
  const row = await c.env.DB.prepare(
    'SELECT id, organisation_id, secret_hash, last_used_at FROM api_keys WHERE prefix = ? AND revoked_at IS NULL',
  )
    .bind(prefix)
    .first<KeyRow>();
  if (!row) return jsonError(c, 401, 'invalid_api_key', 'The API key is invalid or revoked.');

  const incomingHash = await sha256(token);
  if (!timingSafeEqual(incomingHash, row.secret_hash)) return jsonError(c, 401, 'invalid_api_key', 'The API key is invalid or revoked.');

  const [keyAllowed, orgAllowed] = await Promise.all([
    consumeRateLimit(c.env.DB, `key:${row.id}`, 120),
    consumeRateLimit(c.env.DB, `org:${row.organisation_id}`, 600),
  ]);
  if (!keyAllowed || !orgAllowed) return jsonError(c, 429, 'rate_limit_exceeded', 'Request rate limit exceeded.');

  if (!row.last_used_at || row.last_used_at < Date.now() - 5 * 60 * 1000) {
    c.executionCtx.waitUntil(c.env.DB.prepare('UPDATE api_keys SET last_used_at = ? WHERE id = ?').bind(Date.now(), row.id).run());
  }

  c.set('auth', { keyId: row.id, organisationId: row.organisation_id });
  await next();
};
