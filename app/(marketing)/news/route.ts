import { newsMethodNotAllowed, proxyStorkNews } from '../../lib/news-proxy';

export const dynamic = 'force-dynamic';

export function GET(request: Request) {
  return proxyStorkNews(request);
}

export function HEAD(request: Request) {
  return proxyStorkNews(request);
}

export const POST = newsMethodNotAllowed;
export const PUT = newsMethodNotAllowed;
export const PATCH = newsMethodNotAllowed;
export const DELETE = newsMethodNotAllowed;
