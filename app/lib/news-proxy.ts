import { AHREFS_ANALYTICS_KEY, GA_MEASUREMENT_ID } from './site';

const STORK_WIRE = new URL('https://www.stork.ai/wire/w1yiv89paodcwwi5u');
const NEWS_TIMEOUT_MS = 8_000;
const MAX_NEWS_RESPONSE_BYTES = 3 * 1024 * 1024;
// The HTML body is instrumented below, so upstream validators would describe
// different bytes. Edge caching still uses Cache-Control.
const REQUEST_HEADER_ALLOWLIST = ['accept', 'accept-language'];
const RESPONSE_HEADER_ALLOWLIST = ['content-type'];

function escapeHtmlAttribute(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function inlineScriptString(value: string) {
  return JSON.stringify(value)
    .replaceAll('<', '\\u003c')
    .replaceAll('\u2028', '\\u2028')
    .replaceAll('\u2029', '\\u2029');
}

function injectAnalytics(html: string) {
  const gaId = inlineScriptString(GA_MEASUREMENT_ID);
  const analytics = `<script async src="https://analytics.ahrefs.com/analytics.js" data-key="${escapeHtmlAttribute(AHREFS_ANALYTICS_KEY)}"></script>
<script async src="https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}"></script>
<script>window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){window.dataLayer.push(arguments)};window.gtag('js',new Date());window.gtag('config',${gaId});</script>`;
  return /<\/head\s*>/i.test(html) ? html.replace(/<\/head\s*>/i, `${analytics}\n</head>`) : `${analytics}\n${html}`;
}

function newsUrl(request: Request, path: string[]) {
  const target = new URL(STORK_WIRE);
  const suffix = path.map((part) => encodeURIComponent(part)).join('/');
  if (suffix) target.pathname = `${target.pathname.replace(/\/$/, '')}/${suffix}`;
  target.search = new URL(request.url).search;
  return target;
}

export async function proxyStorkNews(request: Request, path: string[] = []) {
  const headers = new Headers({ 'User-Agent': 'InboxRhino-News-Proxy/1.0' });
  for (const name of REQUEST_HEADER_ALLOWLIST) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  let upstream: Response;
  try {
    upstream = await fetch(newsUrl(request, path), {
      method: request.method,
      headers,
      redirect: 'follow',
      signal: AbortSignal.timeout(NEWS_TIMEOUT_MS),
    });
  } catch {
    return new Response('News is temporarily unavailable.', { status: 502 });
  }

  const declaredLength = Number(upstream.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_NEWS_RESPONSE_BYTES) {
    return new Response('News response is too large.', { status: 502 });
  }

  const responseHeaders = new Headers({
    'Cache-Control': 'public, max-age=0, s-maxage=600, stale-while-revalidate=86400',
    'X-Content-Type-Options': 'nosniff',
  });
  for (const name of RESPONSE_HEADER_ALLOWLIST) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }

  if (request.method === 'HEAD' || upstream.status === 304) {
    return new Response(null, { status: upstream.status, headers: responseHeaders });
  }
  const body = await upstream.arrayBuffer();
  if (body.byteLength > MAX_NEWS_RESPONSE_BYTES) return new Response('News response is too large.', { status: 502 });

  const contentType = upstream.headers.get('content-type')?.toLowerCase() ?? '';
  if (!contentType.startsWith('text/html')) {
    return new Response(body, { status: upstream.status, headers: responseHeaders });
  }

  const instrumentedBody = new TextEncoder().encode(injectAnalytics(new TextDecoder().decode(body)));
  if (instrumentedBody.byteLength > MAX_NEWS_RESPONSE_BYTES) {
    return new Response('News response is too large.', { status: 502 });
  }
  return new Response(instrumentedBody, { status: upstream.status, headers: responseHeaders });
}

export function newsMethodNotAllowed() {
  return new Response('Method not allowed.', { status: 405, headers: { Allow: 'GET, HEAD' } });
}
