const STORK_WIRE = new URL('https://www.stork.ai/wire/w1yiv89paodcwwi5u');
const NEWS_TIMEOUT_MS = 8_000;
const MAX_NEWS_RESPONSE_BYTES = 3 * 1024 * 1024;
const REQUEST_HEADER_ALLOWLIST = ['accept', 'accept-language', 'if-modified-since', 'if-none-match'];
const RESPONSE_HEADER_ALLOWLIST = ['content-type', 'etag', 'last-modified'];

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
  return new Response(body, { status: upstream.status, headers: responseHeaders });
}

export function newsMethodNotAllowed() {
  return new Response('Method not allowed.', { status: 405, headers: { Allow: 'GET, HEAD' } });
}
