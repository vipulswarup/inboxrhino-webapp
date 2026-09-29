// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest';
import { newsMethodNotAllowed, proxyStorkNews } from './news-proxy';

afterEach(() => vi.unstubAllGlobals());

describe('news proxy', () => {
  it('forwards only allowlisted request headers', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      expect(headers.get('accept')).toBe('text/html');
      expect(headers.get('authorization')).toBeNull();
      expect(headers.get('cookie')).toBeNull();
      expect(headers.get('if-none-match')).toBeNull();
      expect(headers.get('x-api-key')).toBeNull();
      return new Response('<h1>News</h1>', { status: 200, headers: { 'Content-Type': 'text/html', 'Set-Cookie': 'third-party=1' } });
    });
    vi.stubGlobal('fetch', fetchMock);
    const response = await proxyStorkNews(new Request('https://inboxrhino.in/news?source=test', {
      headers: {
        Accept: 'text/html',
        Authorization: 'Bearer canary',
        Cookie: 'session=canary',
        'If-None-Match': '"upstream-etag"',
        'X-Api-Key': 'canary',
      },
    }));
    expect(response.status).toBe(200);
    expect(response.headers.get('set-cookie')).toBeNull();
    const html = await response.text();
    expect(html).toContain('News');
    expect(html).toContain('https://analytics.ahrefs.com/analytics.js');
    expect(html).toContain('https://www.googletagmanager.com/gtag/js');
    expect(html).toContain("window.gtag('config',\"G-JWMSV0FTTY\")");
    expect(String(fetchMock.mock.calls[0][0])).toBe('https://www.stork.ai/wire/w1yiv89paodcwwi5u?source=test');
  });

  it('does not alter non-HTML responses', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('plain news', {
      headers: { 'Content-Type': 'text/plain' },
    })));
    const response = await proxyStorkNews(new Request('https://inboxrhino.in/news/feed'));
    expect(await response.text()).toBe('plain news');
  });

  it('rejects oversized and mutating requests', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('large', { headers: { 'Content-Length': String(4 * 1024 * 1024) } })));
    await expect(proxyStorkNews(new Request('https://inboxrhino.in/news'))).resolves.toMatchObject({ status: 502 });
    expect(newsMethodNotAllowed().status).toBe(405);
  });
});
