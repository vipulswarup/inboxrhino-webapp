// Only these identifiers may be compiled into browser JavaScript. Service
// credentials belong in Worker bindings, never NEXT_PUBLIC_* variables.
const publicNames = new Set([
  'NEXT_PUBLIC_FIREBASE_API_KEY', 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', 'NEXT_PUBLIC_FIREBASE_APP_ID',
  'NEXT_PUBLIC_TURNSTILE_SITE_KEY', 'NEXT_PUBLIC_GA_MEASUREMENT_ID',
  'NEXT_PUBLIC_INBOXRHINO_API_URL',
]);

export function assertPublicEnvironment(env: Record<string, string | undefined>) {
  const unexpected = Object.keys(env).filter((name) => name.startsWith('NEXT_PUBLIC_') && !publicNames.has(name));
  if (unexpected.length) throw new Error(`Unreviewed public environment variable(s): ${unexpected.join(', ')}. Keep service secrets in Worker bindings.`);
}
