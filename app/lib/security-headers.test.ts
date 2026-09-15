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
});
