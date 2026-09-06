import type { MiddlewareHandler } from 'hono';
import type { Env, Variables } from './types';
import { verifyFirebaseIdToken } from './firebase-auth';
import { jsonError } from './utils';

type MemberRow = {
  user_id: string;
  organisation_id: string;
  role: 'owner' | 'member';
  email_verified: number;
};

export const consoleAuth: MiddlewareHandler<{ Bindings: Env; Variables: Variables }> = async (c, next) => {
  const authorization = c.req.header('Authorization') ?? '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!token) return jsonError(c, 401, 'authentication_required', 'A valid Firebase ID token is required.');

  let claims;
  try {
    claims = await verifyFirebaseIdToken(token, c.env.FIREBASE_PROJECT_ID);
  } catch {
    return jsonError(c, 401, 'invalid_token', 'The authentication token is invalid or expired.');
  }

  const member = await c.env.DB.prepare(
    `SELECT m.user_id, m.organisation_id, m.role, u.email_verified
     FROM users u
     JOIN organisation_members m ON m.user_id = u.id
     WHERE u.firebase_uid = ?
     LIMIT 1`,
  )
    .bind(claims.sub)
    .first<MemberRow>();
  if (!member) return jsonError(c, 403, 'account_not_provisioned', 'Complete sign-in before using the console.');

  c.set('consoleAuth', {
    userId: member.user_id,
    organisationId: member.organisation_id,
    role: member.role,
    firebaseUid: claims.sub,
    email: claims.email,
    emailVerified: Boolean(member.email_verified),
    authTime: claims.auth_time,
  });
  await next();
};

export function requireVerifiedEmail(c: Parameters<typeof consoleAuth>[0]) {
  const auth = c.get('consoleAuth');
  if (!auth.emailVerified) {
    return jsonError(c, 403, 'email_not_verified', 'Verify your email address before using this feature.');
  }
  return null;
}

export function requireOwner(c: Parameters<typeof consoleAuth>[0]) {
  const auth = c.get('consoleAuth');
  if (auth.role !== 'owner') {
    return jsonError(c, 403, 'forbidden', 'This action requires organisation owner access.');
  }
  return null;
}

export function requireRecentAuth(c: Parameters<typeof consoleAuth>[0]) {
  const auth = c.get('consoleAuth');
  const cutoff = Math.floor(Date.now() / 1000) - 10 * 60;
  if (auth.authTime < cutoff) {
    return jsonError(c, 403, 'reauthentication_required', 'Sign in again to perform this action.');
  }
  return null;
}
