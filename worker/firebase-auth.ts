const JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
const JWKS_TTL_MS = 60 * 60 * 1000;

type JwkKey = { kid: string; kty: string; n: string; e: string; alg: string; use: string };
type JwksResponse = { keys: JwkKey[] };

export type FirebaseClaims = {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  auth_time: number;
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

async function loadPublicKeys() {
  const now = Date.now();
  if (cachedKeys && cachedKeys.expiresAt > now) return cachedKeys.keys;
  const response = await fetch(JWKS_URL);
  if (!response.ok) throw new Error('Firebase JWKS could not be loaded.');
  const payload = (await response.json()) as JwksResponse;
  const keys = new Map<string, CryptoKey>();
  for (const jwk of payload.keys) {
    keys.set(jwk.kid, await importRsaKey(jwk));
  }
  cachedKeys = { expiresAt: now + JWKS_TTL_MS, keys };
  return keys;
}

export async function verifyFirebaseIdToken(token: string, projectId: string): Promise<FirebaseClaims> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('invalid_token');

  const header = JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[0]))) as { alg: string; kid: string };
  if (header.alg !== 'RS256' || !header.kid) throw new Error('invalid_token');

  const keys = await loadPublicKeys();
  const publicKey = keys.get(header.kid);
  if (!publicKey) throw new Error('invalid_token');

  const signed = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  const signature = decodeBase64Url(parts[2]);
  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', publicKey, signature, signed);
  if (!valid) throw new Error('invalid_token');

  const claims = JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[1]))) as FirebaseClaims;
  const now = Math.floor(Date.now() / 1000);
  if (claims.exp <= now) throw new Error('token_expired');
  if (claims.iss !== `https://securetoken.google.com/${projectId}`) throw new Error('invalid_token');
  if (claims.aud !== projectId) throw new Error('invalid_token');
  if (!claims.sub || !claims.email) throw new Error('invalid_token');

  return claims;
}
