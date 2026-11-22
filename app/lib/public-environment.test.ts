import { describe, expect, it } from 'vitest';
import { assertPublicEnvironment } from './public-environment';

describe('public environment boundary', () => {
  it('allows public identifiers and private Worker bindings', () => {
    expect(() => assertPublicEnvironment({ NEXT_PUBLIC_FIREBASE_API_KEY: 'public-id', TURNSTILE_SECRET_KEY: 'private' })).not.toThrow();
  });
  it('rejects accidentally exposed credentials without printing values', () => {
    expect(() => assertPublicEnvironment({ NEXT_PUBLIC_TURNSTILE_SECRET_KEY: 'do-not-print' })).toThrow('Unreviewed public environment variable');
    try { assertPublicEnvironment({ NEXT_PUBLIC_SETUP_TOKEN: 'do-not-print' }); } catch (error) { expect(String(error)).not.toContain('do-not-print'); }
  });
});
