import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetFirebaseKeyCache, verifyFirebaseIdToken } from './firebase-auth';

function b64url(value: object) {
  return btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

describe('verifyFirebaseIdToken key refresh', () => {
  beforeEach(() => resetFirebaseKeyCache());
  afterEach(() => vi.unstubAllGlobals());

  it('refetches the JWKS at most once per cooldown for unknown key ids', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ keys: [] }), { headers: { 'Cache-Control': 'max-age=3600' } }));
    vi.stubGlobal('fetch', fetchMock);
    const token = `${b64url({ alg: 'RS256', kid: 'unknown' })}.${b64url({})}.sig`;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await expect(verifyFirebaseIdToken(token, 'project')).rejects.toThrow('invalid_token');
    }
    // One initial load plus one forced refresh; later attempts fall inside the cooldown.
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
