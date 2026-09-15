import { afterEach, describe, expect, it, vi } from 'vitest';
import { verifyTurnstile } from './turnstile';

const now = Date.parse('2026-09-15T10:00:00Z');
const expectations = { allowedHostnames: ['app.inboxrhino.in'], expectedAction: 'signup', now };

function response(overrides: Record<string, unknown> = {}) {
  return new Response(JSON.stringify({
    success: true,
    hostname: 'app.inboxrhino.in',
    action: 'signup',
    challenge_ts: '2026-09-15T09:59:00Z',
    ...overrides,
  }), { headers: { 'Content-Type': 'application/json' } });
}

afterEach(() => vi.unstubAllGlobals());

describe('verifyTurnstile', () => {
  it('accepts only the intended hostname, action and challenge age', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => response()));
    await expect(verifyTurnstile('secret', 'token', '192.0.2.1', expectations)).resolves.toBe(true);

    vi.stubGlobal('fetch', vi.fn(async () => response({ hostname: 'attacker.example' })));
    await expect(verifyTurnstile('secret', 'token', null, expectations)).resolves.toBe(false);

    vi.stubGlobal('fetch', vi.fn(async () => response({ action: 'login' })));
    await expect(verifyTurnstile('secret', 'token', null, expectations)).resolves.toBe(false);

    vi.stubGlobal('fetch', vi.fn(async () => response({ challenge_ts: '2026-09-15T09:50:00Z' })));
    await expect(verifyTurnstile('secret', 'token', null, expectations)).resolves.toBe(false);
  });
});
