import { describe, expect, it } from 'vitest';
import { browserContentSecurityPolicy, browserSecurityHeaders } from './security-headers';

describe('browser security headers', () => {
  it('blocks framing and dangerous default capabilities', () => {
    expect(browserContentSecurityPolicy).toContain("frame-ancestors 'none'");
    expect(browserContentSecurityPolicy).toContain("object-src 'none'");
    expect(browserContentSecurityPolicy).toContain("base-uri 'self'");
    expect(browserSecurityHeaders['X-Frame-Options']).toBe('DENY');
    expect(browserSecurityHeaders['X-Content-Type-Options']).toBe('nosniff');
    expect(browserSecurityHeaders['Strict-Transport-Security']).toContain('includeSubDomains');
  });

  it('allows the configured analytics and Stork news resources', () => {
    expect(browserContentSecurityPolicy).toContain('https://static.cloudflareinsights.com');
    expect(browserContentSecurityPolicy).toContain('https://cloudflareinsights.com');
    expect(browserContentSecurityPolicy).toContain('https://analytics.ahrefs.com');
    expect(browserContentSecurityPolicy).toContain('https://www.googletagmanager.com');
    expect(browserContentSecurityPolicy).toContain('https://*.convex.cloud');
    expect(browserContentSecurityPolicy).toContain("font-src 'self' data: https://www.stork.ai");
  });
});
