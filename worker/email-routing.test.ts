import { describe, expect, it } from 'vitest';
import { createEmailRoute, deleteEmailRoute, EmailRoutingError } from './email-routing';
import type { Env } from './types';

const env = {
  CLOUDFLARE_EMAIL_ROUTING_TOKEN: 'test-token',
  CLOUDFLARE_ZONE_ID: 'zone-id',
  EMAIL_WORKER_NAME: 'inboxrhino-api',
  INBOX_DOMAIN: 'test.inboxrhino.in',
} as Env;

function jsonResponse(result: unknown, resultInfo?: unknown) {
  return new Response(JSON.stringify({ success: true, result, result_info: resultInfo }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('Email Routing automation', () => {
  it('creates an exact-address rule that targets the InboxRhino Worker', async () => {
    let request: { url: string; init?: RequestInit } | undefined;
    const fetcher = (async (input: RequestInfo | URL, init?: RequestInit) => {
      request = { url: String(input), init };
      return jsonResponse({ id: 'rule-created' });
    }) as typeof fetch;

    await expect(createEmailRoute(env, 'fresh-box@test.inboxrhino.in', fetcher)).resolves.toBe('rule-created');
    expect(request?.url).toBe('https://api.cloudflare.com/client/v4/zones/zone-id/email/routing/rules');
    expect(request?.init?.method).toBe('POST');
    expect(JSON.parse(String(request?.init?.body))).toEqual({
      name: 'InboxRhino: fresh-box@test.inboxrhino.in',
      enabled: true,
      matchers: [{ type: 'literal', field: 'to', value: 'fresh-box@test.inboxrhino.in' }],
      actions: [{ type: 'worker', value: ['inboxrhino-api'] }],
    });
  });

  it('rejects addresses outside the isolated test domain without making a request', async () => {
    let called = false;
    const fetcher = (async () => {
      called = true;
      return jsonResponse({});
    }) as typeof fetch;

    await expect(createEmailRoute(env, 'contact@inboxrhino.in', fetcher)).rejects.toBeInstanceOf(EmailRoutingError);
    expect(called).toBe(false);
  });

  it('deletes a stored routing rule directly', async () => {
    const requests: Array<{ url: string; method?: string }> = [];
    const fetcher = (async (input: RequestInfo | URL, init?: RequestInit) => {
      requests.push({ url: String(input), method: init?.method });
      return jsonResponse({ id: 'rule-1' });
    }) as typeof fetch;

    await expect(deleteEmailRoute(env, 'fresh-box@test.inboxrhino.in', 'rule-1', fetcher)).resolves.toBe(true);
    expect(requests).toEqual([
      {
        url: 'https://api.cloudflare.com/client/v4/zones/zone-id/email/routing/rules/rule-1',
        method: 'DELETE',
      },
    ]);
  });

  it('finds and deletes a legacy exact-address rule when no rule ID was stored', async () => {
    const requests: Array<{ url: string; method?: string }> = [];
    const fetcher = (async (input: RequestInfo | URL, init?: RequestInit) => {
      requests.push({ url: String(input), method: init?.method });
      if (init?.method === 'GET') {
        return jsonResponse(
          [
            {
              id: 'legacy-rule',
              matchers: [{ type: 'literal', field: 'to', value: 'legacy@test.inboxrhino.in' }],
              actions: [{ type: 'worker', value: ['inboxrhino-api'] }],
            },
          ],
          { page: 1, total_pages: 1 },
        );
      }
      return jsonResponse({ id: 'legacy-rule' });
    }) as typeof fetch;

    await expect(deleteEmailRoute(env, 'legacy@test.inboxrhino.in', null, fetcher)).resolves.toBe(true);
    expect(requests.map((request) => request.method)).toEqual(['GET', 'DELETE']);
  });
});
