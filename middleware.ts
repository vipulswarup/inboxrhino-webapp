import { NextRequest, NextResponse } from 'next/server';

const CANONICAL_HOST = 'inboxrhino.in';
const HTTPS_HOSTS = new Set(['inboxrhino.in', 'www.inboxrhino.in', 'app.inboxrhino.in']);

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

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
