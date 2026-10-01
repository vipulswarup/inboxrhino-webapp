const POLICY_HOST = 'mta-sts.test.inboxrhino.in';
const POLICY_PATH = '/.well-known/mta-sts.txt';
const POLICY = 'version: STSv1\nmode: enforce\nmx: *.mx.cloudflare.net\nmax_age: 86400\n';

export default {
  fetch(request: Request): Response {
    const url = new URL(request.url);
    if (url.hostname !== POLICY_HOST || url.pathname !== POLICY_PATH || url.search || !['GET', 'HEAD'].includes(request.method)) {
      return new Response('Not found', { status: 404 });
    }

    return new Response(request.method === 'HEAD' ? null : POLICY, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
        'Strict-Transport-Security': 'max-age=31536000',
      },
    });
  },
};
