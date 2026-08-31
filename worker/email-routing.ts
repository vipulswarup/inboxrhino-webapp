import type { Env } from './types';

type CloudflareError = { code?: number; message?: string };
type CloudflareEnvelope<T> = {
  success: boolean;
  result: T;
  errors?: CloudflareError[];
  result_info?: { page?: number; total_pages?: number };
};

type RoutingRule = {
  id: string;
  actions?: Array<{ type?: string; value?: string[] }>;
  matchers?: Array<{ type?: string; field?: string; value?: string }>;
};

export class EmailRoutingError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'EmailRoutingError';
  }
}

function routingBase(env: Env) {
  if (!env.CLOUDFLARE_EMAIL_ROUTING_TOKEN || !env.CLOUDFLARE_ZONE_ID || !env.EMAIL_WORKER_NAME || !env.INBOX_DOMAIN) {
    throw new EmailRoutingError('Email Routing automation is not configured.', 503);
  }
  return `https://api.cloudflare.com/client/v4/zones/${encodeURIComponent(env.CLOUDFLARE_ZONE_ID)}/email/routing/rules`;
}

async function cloudflareRequest<T>(env: Env, url: string, init: RequestInit, fetcher: typeof fetch): Promise<CloudflareEnvelope<T>> {
  const response = await fetcher(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.CLOUDFLARE_EMAIL_ROUTING_TOKEN}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
  const payload = (await response.json().catch(() => null)) as CloudflareEnvelope<T> | null;
  if (!response.ok || !payload?.success) {
    const detail = payload?.errors?.map((error) => error.message).filter(Boolean).join('; ');
    throw new EmailRoutingError(detail || `Cloudflare Email Routing returned HTTP ${response.status}.`, response.status);
  }
  return payload;
}

export async function createEmailRoute(env: Env, address: string, fetcher: typeof fetch = fetch) {
  const base = routingBase(env);
  const expectedSuffix = `@${env.INBOX_DOMAIN.toLowerCase()}`;
  if (!address.toLowerCase().endsWith(expectedSuffix)) throw new EmailRoutingError('Inbox address is outside the configured mail domain.', 422);
  const payload = await cloudflareRequest<RoutingRule>(
    env,
    base,
    {
      method: 'POST',
      body: JSON.stringify({
        name: `InboxRhino: ${address}`,
        enabled: true,
        matchers: [{ type: 'literal', field: 'to', value: address }],
        actions: [{ type: 'worker', value: [env.EMAIL_WORKER_NAME] }],
      }),
    },
    fetcher,
  );
  if (!payload.result?.id) throw new EmailRoutingError('Cloudflare did not return a routing rule identifier.', 502);
  return payload.result.id;
}

async function findEmailRoute(env: Env, address: string, fetcher: typeof fetch) {
  const base = routingBase(env);
  let page = 1;
  do {
    const payload = await cloudflareRequest<RoutingRule[]>(env, `${base}?page=${page}&per_page=50`, { method: 'GET' }, fetcher);
    const match = payload.result.find((rule) =>
      rule.matchers?.some(
        (matcher) => matcher.type === 'literal' && matcher.field === 'to' && matcher.value?.toLowerCase() === address.toLowerCase(),
      ),
    );
    if (match) return match.id;
    const totalPages = payload.result_info?.total_pages ?? page;
    if (page >= totalPages) return null;
    page += 1;
  } while (page <= 100);
  return null;
}

export async function deleteEmailRoute(env: Env, address: string, ruleId?: string | null, fetcher: typeof fetch = fetch) {
  const id = ruleId || (await findEmailRoute(env, address, fetcher));
  if (!id) return false;
  const response = await fetcher(`${routingBase(env)}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${env.CLOUDFLARE_EMAIL_ROUTING_TOKEN}` },
  });
  if (response.status === 404) return false;
  const payload = (await response.json().catch(() => null)) as CloudflareEnvelope<unknown> | null;
  if (!response.ok || !payload?.success) {
    const detail = payload?.errors?.map((error) => error.message).filter(Boolean).join('; ');
    throw new EmailRoutingError(detail || `Cloudflare Email Routing returned HTTP ${response.status}.`, response.status);
  }
  return true;
}
