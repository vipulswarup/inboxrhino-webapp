function resolveApiBase() {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') return 'https://api.inboxrhino.in';
  }
  return process.env.NEXT_PUBLIC_INBOXRHINO_API_URL ?? 'https://api.inboxrhino.in';
}

export const apiBase = resolveApiBase();

export const turnstileSiteKey =
  typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? '1x00000000000000000000AA'
    : (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '1x00000000000000000000AA');

export type SessionResponse = {
  user: { id: string; email: string; display_name: string | null; email_verified: boolean };
  organisation: { id: string; name: string; plan: string };
  role: 'owner' | 'member';
};

export type ApiKeySummary = {
  id: string;
  name: string;
  prefix: string;
  created_at: string;
  last_used_at: string | null;
};

export type ApiInbox = {
  id: string;
  address: string;
  local_part: string;
  status: string;
  created_at: string;
};

export type ApiMessageSummary = {
  id: string;
  inbox_id: string;
  from: { name: string; address: string };
  to: string;
  subject: string;
  preview: string;
  size_bytes: number;
  received_at: string;
  expires_at: string;
};

export type ApiMessage = ApiMessageSummary & {
  internet_message_id: string | null;
  text: string | null;
  html: string | null;
  headers: Array<[string, string]>;
  attachments: Array<{
    id: string;
    filename: string;
    content_type: string;
    size_bytes: number;
    disposition: string;
    content_id: string | null;
  }>;
};

export type UsageResponse = {
  plan: string;
  period: { starts_at: string; ends_at: string };
  inboxes: { active: number; limit: number; remaining: number };
  emails: { received: number; limit: number; remaining: number };
};

async function parseError(response: Response) {
  try {
    const payload = (await response.json()) as { error?: { message?: string } };
    return payload.error?.message ?? 'The request could not be completed.';
  } catch {
    return 'The request could not be completed.';
  }
}

export async function createConsoleSession(idToken: string, turnstileToken?: string) {
  const payload: { id_token: string; turnstile_token?: string } = { id_token: idToken };
  if (turnstileToken) payload.turnstile_token = turnstileToken;
  const response = await fetch(`${apiBase}/console/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await parseError(response));
  return (await response.json()) as SessionResponse;
}

export async function consoleFetch<T>(path: string, idToken: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${idToken}`);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const response = await fetch(`${apiBase}${path}`, { ...init, headers });
  if (!response.ok) throw new Error(await parseError(response));
  if (response.status === 204) return null as T;
  return (await response.json()) as T;
}

export async function downloadAttachment(id: string, idToken: string, filename: string) {
  const response = await fetch(`${apiBase}/console/attachments/${id}`, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!response.ok) throw new Error(await parseError(response));
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
