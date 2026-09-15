export function rateLimitBucket(now: number, windowMs: number) {
  return String(Math.floor(now / windowMs));
}

export async function currentRateLimitCount(db: D1Database, scope: string, windowMs: number, now = Date.now()) {
  const bucket = rateLimitBucket(now, windowMs);
  const row = await db.prepare('SELECT count FROM rate_limits WHERE scope = ? AND bucket = ?')
    .bind(scope, bucket)
    .first<{ count: number }>();
  return row?.count ?? 0;
}

export async function consumeRateLimit(
  db: D1Database,
  scope: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
) {
  const bucket = rateLimitBucket(now, windowMs);
  const expiresAt = (Math.floor(now / windowMs) + 1) * windowMs + 60_000;
  await db.prepare(
    `INSERT INTO rate_limits (scope, bucket, count, expires_at) VALUES (?, ?, 1, ?)
     ON CONFLICT(scope, bucket) DO UPDATE SET count = count + 1`,
  )
    .bind(scope, bucket, expiresAt)
    .run();
  const count = await currentRateLimitCount(db, scope, windowMs, now);
  return { allowed: count <= limit, count, retryAfterSeconds: Math.max(1, Math.ceil((expiresAt - 60_000 - now) / 1000)) };
}
