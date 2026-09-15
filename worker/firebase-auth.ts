const JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
const JWKS_TTL_MS = 60 * 60 * 1000;
const JWKS_FETCH_TIMEOUT_MS = 5_000;
const MAX_TOKEN_BYTES = 16 * 1024;
const MAX_CLOCK_SKEW_SECONDS = 60;

type JwkKey = { kid: string; kty: string; n: string; e: string; alg: string; use: string };
type JwksResponse = { keys: JwkKey[] };

export type FirebaseClaims = {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  auth_time: number;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
};

let cachedKeys: { expiresAt: number; keys: Map<string, CryptoKey> } | null = null;

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

async function importRsaKey(jwk: JwkKey) {
  return crypto.subtle.importKey(
    'jwk',
    { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: jwk.alg, ext: true },
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  );
}

function cacheTtl(response: Response) {
  const match = /(?:^|,)\s*max-age=(\d+)/i.exec(response.headers.get('Cache-Control') ?? '');
  if (!match) return JWKS_TTL_MS;
  return Math.min(JWKS_TTL_MS, Math.max(60_000, Number(match[1]) * 1000));
}

async function loadPublicKeys(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedKeys && cachedKeys.expiresAt > now) return cachedKeys.keys;
  const response = await fetch(JWKS_URL, { signal: AbortSignal.timeout(JWKS_FETCH_TIMEOUT_MS) });
  if (!response.ok) throw new Error('Firebase JWKS could not be loaded.');
  const payload = (await response.json()) as JwksResponse;
  const keys = new Map<string, CryptoKey>();
  for (const jwk of payload.keys) {
    keys.set(jwk.kid, await importRsaKey(jwk));
  }
  cachedKeys = { expiresAt: now + cacheTtl(response), keys };
  return keys;
}

export async function verifyFirebaseIdToken(token: string, projectId: string): Promise<FirebaseClaims> {
  if (!token || token.length > MAX_TOKEN_BYTES || !projectId) throw new Error('invalid_token');
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('invalid_token');

  const header = JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[0]))) as { alg: string; kid: string };
  if (header.alg !== 'RS256' || !header.kid) throw new Error('invalid_token');

  let keys = await loadPublicKeys();
  let publicKey = keys.get(header.kid);
  if (!publicKey) {
    keys = await loadPublicKeys(true);
    publicKey = keys.get(header.kid);
  }
  if (!publicKey) throw new Error('invalid_token');

  const signed = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  const signature = decodeBase64Url(parts[2]);
  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', publicKey, signature, signed);
  if (!valid) throw new Error('invalid_token');

  const claims = JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[1]))) as FirebaseClaims;
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isSafeInteger(claims.exp) || claims.exp <= now) throw new Error('token_expired');
  if (!Number.isSafeInteger(claims.iat) || claims.iat > now + MAX_CLOCK_SKEW_SECONDS) throw new Error('invalid_token');
  if (!Number.isSafeInteger(claims.auth_time) || claims.auth_time > now + MAX_CLOCK_SKEW_SECONDS || claims.auth_time > claims.iat) {
    throw new Error('invalid_token');
  }
  if (claims.iss !== `https://securetoken.google.com/${projectId}`) throw new Error('invalid_token');
  if (claims.aud !== projectId) throw new Error('invalid_token');
  if (typeof claims.sub !== 'string' || claims.sub.length < 1 || claims.sub.length > 128) throw new Error('invalid_token');
  if (typeof claims.email !== 'string' || claims.email.length < 3 || claims.email.length > 320) throw new Error('invalid_token');
  if (typeof claims.email_verified !== 'boolean') throw new Error('invalid_token');
  if (claims.name !== undefined && typeof claims.name !== 'string') throw new Error('invalid_token');

  return claims;
}
