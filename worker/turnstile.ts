type TurnstileResponse = {
  success: boolean;
  hostname?: string;
  action?: string;
  challenge_ts?: string;
  'error-codes'?: string[];
};

type TurnstileExpectations = {
  allowedHostnames: string[];
  expectedAction: string;
  now?: number;
};

const MAX_CHALLENGE_AGE_MS = 5 * 60 * 1000;
const MAX_CLOCK_SKEW_MS = 60 * 1000;

export async function verifyTurnstile(
  secret: string,
  token: string,
  remoteIp: string | null,
  expectations: TurnstileExpectations,
) {
  if (!secret || !token) return false;
  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set('remoteip', remoteIp);
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!response.ok) return false;
  const payload = (await response.json()) as TurnstileResponse;
  if (payload.success !== true || !payload.hostname || !payload.action || !payload.challenge_ts) return false;
  if (!expectations.allowedHostnames.includes(payload.hostname.toLowerCase())) return false;
  if (payload.action !== expectations.expectedAction) return false;
  const challengedAt = Date.parse(payload.challenge_ts);
  const now = expectations.now ?? Date.now();
  if (!Number.isFinite(challengedAt)) return false;
  if (challengedAt > now + MAX_CLOCK_SKEW_MS || challengedAt < now - MAX_CHALLENGE_AGE_MS) return false;
  return true;
}
