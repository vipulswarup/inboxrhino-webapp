import { NextRequest, NextResponse } from 'next/server';
import { APP_ROBOTS_TXT, isAppHost, isCacheablePublicAsset, robotsHeaderValue } from './app/lib/seo';

const CANONICAL_HOST = 'inboxrhino.in';
const HTTPS_HOSTS = new Set(['inboxrhino.in', 'www.inboxrhino.in', 'app.inboxrhino.in']);

function withOptionalRobots(hostname: string, pathname: string, response: NextResponse) {
  const robots = robotsHeaderValue(hostname, pathname);
  if (robots) response.headers.set('X-Robots-Tag', robots);
  if (isCacheablePublicAsset(pathname)) {
    response.headers.set('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400');
  }
  return response;
}

export function middleware(request: NextRequest) {
  const host = (request.headers.get('host') ?? '').split(':')[0].toLowerCase();
  const proto = (request.headers.get('x-forwarded-proto') ?? request.nextUrl.protocol.replace(':', '')).toLowerCase();
  const url = request.nextUrl.clone();

  if (host === 'www.inboxrhino.in') {
    url.hostname = CANONICAL_HOST;
    url.protocol = 'https:';
    url.port = '';
    return NextResponse.redirect(url, 301);
  }

  if (HTTPS_HOSTS.has(host) && proto === 'http') {
    url.protocol = 'https:';
    url.port = '';
    return NextResponse.redirect(url, 301);
  }

  // Keep /news paths intact so the Stork Wire proxy rewrite can match as-is.
  if (
    !url.pathname.startsWith('/news') &&
    url.pathname.length > 1 &&
    url.pathname.endsWith('/') &&
    !url.pathname.split('/').pop()?.includes('.')
  ) {
    url.pathname = url.pathname.replace(/\/+$/, '');
    return NextResponse.redirect(url, 301);
  }

  if (isAppHost(host) && url.pathname === '/robots.txt') {
    return new NextResponse(APP_ROBOTS_TXT, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    });
  }

  return withOptionalRobots(host, url.pathname, NextResponse.next());
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
