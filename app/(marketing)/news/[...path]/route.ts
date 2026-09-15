import { newsMethodNotAllowed, proxyStorkNews } from '../../../lib/news-proxy';

export const dynamic = 'force-dynamic';

type NewsRouteContext = { params: Promise<{ path: string[] }> };

export async function GET(request: Request, context: NewsRouteContext) {
  return proxyStorkNews(request, (await context.params).path);
}

export async function HEAD(request: Request, context: NewsRouteContext) {
  return proxyStorkNews(request, (await context.params).path);
}

export const POST = newsMethodNotAllowed;
export const PUT = newsMethodNotAllowed;
export const PATCH = newsMethodNotAllowed;
export const DELETE = newsMethodNotAllowed;
