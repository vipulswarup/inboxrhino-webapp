const commonDirectives = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self' https://accounts.google.com",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://analytics.ahrefs.com https://challenges.cloudflare.com https://apis.google.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://www.google-analytics.com https://www.googletagmanager.com https://www.stork.ai https://*.googleusercontent.com",
  "font-src 'self' data:",
  "connect-src 'self' https://api.inboxrhino.in https://inboxrhino-prod.firebaseapp.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com https://firebaseinstallations.googleapis.com https://www.google-analytics.com https://region1.google-analytics.com https://analytics.google.com https://analytics.ahrefs.com https://challenges.cloudflare.com",
  "frame-src https://challenges.cloudflare.com https://accounts.google.com https://inboxrhino-prod.firebaseapp.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  'upgrade-insecure-requests',
];

export const browserContentSecurityPolicy = commonDirectives.join('; ');

export const browserSecurityHeaders = {
  'Content-Security-Policy': browserContentSecurityPolicy,
  'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
  'Permissions-Policy': 'camera=(), geolocation=(), microphone=(), payment=(), usb=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
} as const;
