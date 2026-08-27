'use client';

import Image from 'next/image';
import { type CSSProperties, type FormEvent, useEffect, useMemo, useState } from 'react';
import { brandColors } from './brand';

export type Message = {
  id: string;
  senderName: string;
  senderEmail: string;
  recipient: string;
  subject: string;
  preview: string;
  receivedAt: string;
  dateLabel: string;
  unread: boolean;
  html: string;
  text: string;
  headers: Array<[string, string]>;
  attachments: Array<{ name: string; size: string; type: string }>;
};

export const messages: Message[] = [
  {
    id: 'msg_01k4verify',
    senderName: 'Acme',
    senderEmail: 'hello@acme.dev',
    recipient: 'cheerful-panda-x7k2@test.inboxrhino.in',
    subject: 'Verify your email address',
    preview: 'Welcome to Acme. Confirm your email address to finish setting up your account.',
    receivedAt: '10:42 AM',
    dateLabel: 'Today, 10:42 AM',
    unread: true,
    html: `<!doctype html><html><body style="margin:0;background:#f7f4ef;color:#1c1917;font-family:Arial,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:42px 20px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fff;border:1px solid #e7e5e4;border-radius:18px"><tr><td style="padding:36px"><div style="font-size:14px;font-weight:700;letter-spacing:.08em;color:#0f3d3e">ACME</div><h1 style="font-size:28px;line-height:1.2;margin:32px 0 14px">Verify your email address</h1><p style="font-size:16px;line-height:1.65;color:#57534e;margin:0 0 28px">Welcome to Acme. Confirm your email address to finish setting up your account.</p><a href="#" style="display:inline-block;background:#0f3d3e;color:white;text-decoration:none;font-weight:700;padding:14px 20px;border-radius:9px">Verify email</a><p style="font-size:13px;line-height:1.5;color:#78716c;margin:30px 0 0">This link expires in 30 minutes. If you didn’t create this account, you can safely ignore this email.</p></td></tr></table></td></tr></table></body></html>`,
    text: `Verify your email address\n\nWelcome to Acme. Confirm your email address to finish setting up your account.\n\nVerify email: https://acme.dev/verify/tk_demo_4fr8zk\n\nThis link expires in 30 minutes. If you didn't create this account, you can safely ignore this email.`,
    headers: [
      ['Message-ID', '<20260826051238.4fr8zk@acme.dev>'],
      ['From', 'Acme <hello@acme.dev>'],
      ['To', 'cheerful-panda-x7k2@test.inboxrhino.in'],
      ['Date', 'Wed, 26 Aug 2026 05:12:38 +0000'],
      ['Content-Type', 'multipart/alternative; boundary=acme-7d92'],
      ['X-Mailer', 'Acme Transactional/2.4'],
    ],
    attachments: [],
  },
  {
    id: 'msg_01k4invoice',
    senderName: 'Papertrail Labs',
    senderEmail: 'billing@papertrail.test',
    recipient: 'cheerful-panda-x7k2@test.inboxrhino.in',
    subject: 'Your August invoice is ready',
    preview: 'Invoice PT-2048 is attached. Thank you for your business.',
    receivedAt: '9:18 AM',
    dateLabel: 'Today, 9:18 AM',
    unread: false,
    html: `<!doctype html><html><body style="margin:0;padding:42px 20px;background:#f4f1ea;color:#1c1917;font-family:Arial,sans-serif"><main style="max-width:560px;margin:auto;background:#fff;border-radius:18px;padding:36px"><p style="font-size:13px;color:#0f3d3e;font-weight:bold">PAPERTRAIL LABS</p><h1>Invoice PT-2048</h1><p style="line-height:1.65;color:#57534e">Your August invoice is ready. The PDF is attached to this email.</p><p style="font-size:28px;font-weight:bold">₹4,720.00</p></main></body></html>`,
    text: 'Invoice PT-2048\n\nYour August invoice is ready.\nTotal: ₹4,720.00\n\nThe PDF is attached to this email.',
    headers: [
      ['Message-ID', '<invoice-2048@papertrail.test>'],
      ['From', 'Papertrail Labs <billing@papertrail.test>'],
      ['To', 'cheerful-panda-x7k2@test.inboxrhino.in'],
      ['Date', 'Wed, 26 Aug 2026 03:48:10 +0000'],
      ['Content-Type', 'multipart/mixed; boundary=pt-2048'],
    ],
    attachments: [{ name: 'invoice-PT-2048.pdf', size: '184 KB', type: 'PDF' }],
  },
  {
    id: 'msg_01k4magic',
    senderName: 'Northstar',
    senderEmail: 'auth@northstar.app',
    recipient: 'cheerful-panda-x7k2@test.inboxrhino.in',
    subject: 'Your secure sign-in link',
    preview: 'Use this magic link to sign in. It expires in 10 minutes.',
    receivedAt: 'Yesterday',
    dateLabel: 'Yesterday, 6:07 PM',
    unread: false,
    html: `<!doctype html><html><body style="margin:0;padding:42px 20px;background:#f8fafc;color:#172033;font-family:Arial,sans-serif"><main style="max-width:560px;margin:auto;background:white;border:1px solid #e2e8f0;border-radius:18px;padding:36px"><p style="font-weight:bold;color:#2563eb">NORTHSTAR</p><h1>Your secure sign-in link</h1><p style="line-height:1.65;color:#475569">Use the button below to sign in. It expires in 10 minutes.</p><a href="#" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:14px 20px;border-radius:9px;font-weight:bold">Sign in securely</a></main></body></html>`,
    text: 'Your secure sign-in link\n\nUse this link to sign in: https://northstar.app/magic/demo\n\nIt expires in 10 minutes.',
    headers: [
      ['Message-ID', '<magic-demo@northstar.app>'],
      ['From', 'Northstar <auth@northstar.app>'],
      ['To', 'cheerful-panda-x7k2@test.inboxrhino.in'],
      ['Date', 'Tue, 25 Aug 2026 12:37:02 +0000'],
      ['Content-Type', 'multipart/alternative; boundary=northstar-42'],
    ],
    attachments: [],
  },
];

type Tab = 'html' | 'text' | 'headers';

type ApiInbox = { id: string; address: string; local_part: string };
type ApiMessage = {
  id: string;
  from: { name: string; address: string };
  to: string;
  subject: string;
  preview: string;
  received_at: string;
  html: string | null;
  text: string | null;
  headers: Array<[string, string]>;
  attachments: Array<{ filename: string; size_bytes: number; content_type: string }>;
};

const apiBase = process.env.NEXT_PUBLIC_INBOXRHINO_API_URL ?? 'https://api.inboxrhino.in';

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function mapApiMessage(message: ApiMessage): Message {
  const received = new Date(message.received_at);
  return {
    id: message.id,
    senderName: message.from.name || message.from.address,
    senderEmail: message.from.address,
    recipient: message.to,
    subject: message.subject || '(no subject)',
    preview: message.preview,
    receivedAt: received.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    dateLabel: received.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }),
    unread: false,
    html: message.html ?? '<html><body><p>This message has no HTML part.</p></body></html>',
    text: message.text ?? '',
    headers: message.headers,
    attachments: message.attachments.map((attachment) => ({
      name: attachment.filename,
      size: formatBytes(attachment.size_bytes),
      type: attachment.content_type.split('/').at(-1)?.toUpperCase() ?? 'FILE',
    })),
  };
}

export const emailPreviewCsp =
  "default-src 'none'; img-src data: blob:; style-src 'unsafe-inline'; font-src data:; form-action 'none'; base-uri 'none';";

export function createSafeEmailDocument(html: string) {
  const securityHead = `<meta http-equiv="Content-Security-Policy" content="${emailPreviewCsp}"><meta name="referrer" content="no-referrer">`;

  if (/<head[\s>]/i.test(html)) {
    return html.replace(/<head([^>]*)>/i, `<head$1>${securityHead}`);
  }

  return html.replace(/<html([^>]*)>/i, `<html$1><head>${securityHead}</head>`);
}

function Logo() {
  return (
    <div className="flex items-center gap-2.5" aria-label="InboxRhino">
      <span className="grid size-9 place-items-center rounded-[11px] border border-[#1C1917]/10 bg-[#F7F4EF] shadow-sm">
        <Image src="/favicon.svg" width={30} height={30} alt="" priority />
      </span>
      <span className="hidden text-[15px] font-bold tracking-[-0.02em] text-[#1C1917] sm:block">InboxRhino</span>
    </div>
  );
}

function NavIcon({ children }: { children: React.ReactNode }) {
  return <span aria-hidden="true" className="grid size-5 place-items-center text-[16px] text-current">{children}</span>;
}

export function MessageViewer() {
  const [activeId, setActiveId] = useState(messages[0].id);
  const [activeTab, setActiveTab] = useState<Tab>('html');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [displayMessages, setDisplayMessages] = useState<Message[]>(messages);
  const [activeInbox, setActiveInbox] = useState<ApiInbox>({
    id: 'demo',
    address: messages[0].recipient,
    local_part: messages[0].recipient.split('@')[0],
  });
  const [usage, setUsage] = useState({ received: 3, limit: 33 });
  const [connection, setConnection] = useState<'demo' | 'loading' | 'live' | 'error'>('demo');
  const [connectOpen, setConnectOpen] = useState(false);
  const [connectError, setConnectError] = useState('');
  const activeMessage = useMemo(
    () => displayMessages.find((message) => message.id === activeId) ?? displayMessages[0] ?? messages[0],
    [activeId, displayMessages],
  );
  const palette = {
    '--brand-ink': brandColors.ink,
    '--brand-cream': brandColors.cream,
    '--brand-cream-deep': brandColors.creamDeep,
    '--brand-teal': brandColors.teal,
  } as CSSProperties;

  const selectMessage = (messageId: string) => {
    setActiveId(messageId);
    setActiveTab('html');
    setDetailsOpen(false);
  };

  const loadLiveInbox = async (apiKey: string) => {
    setConnection('loading');
    setConnectError('');
    const headers = { Authorization: `Bearer ${apiKey}` };
    const [inboxResponse, usageResponse] = await Promise.all([
      fetch(`${apiBase}/v1/inboxes?limit=1`, { headers }),
      fetch(`${apiBase}/v1/usage`, { headers }),
    ]);
    if (!inboxResponse.ok || !usageResponse.ok) throw new Error('The API key could not be authenticated.');
    const inboxPayload = (await inboxResponse.json()) as { data: ApiInbox[] };
    const usagePayload = (await usageResponse.json()) as { emails: { received: number; limit: number } };
    setUsage(usagePayload.emails);
    const inbox = inboxPayload.data[0];
    if (!inbox) {
      setDisplayMessages([]);
      setConnection('live');
      sessionStorage.setItem('inboxrhino_api_key', apiKey);
      return;
    }
    setActiveInbox(inbox);
    const listResponse = await fetch(`${apiBase}/v1/inboxes/${inbox.id}/messages?limit=50`, { headers });
    if (!listResponse.ok) throw new Error('Messages could not be loaded.');
    const listPayload = (await listResponse.json()) as { data: Array<{ id: string }> };
    const fullMessages = await Promise.all(
      listPayload.data.map(async ({ id }) => {
        const response = await fetch(`${apiBase}/v1/messages/${id}`, { headers });
        if (!response.ok) throw new Error('A message could not be loaded.');
        const payload = (await response.json()) as { data: ApiMessage };
        return mapApiMessage(payload.data);
      }),
    );
    setDisplayMessages(fullMessages);
    if (fullMessages[0]) setActiveId(fullMessages[0].id);
    setConnection('live');
    sessionStorage.setItem('inboxrhino_api_key', apiKey);
  };

  useEffect(() => {
    const apiKey = sessionStorage.getItem('inboxrhino_api_key');
    if (!apiKey) return;
    const timeout = window.setTimeout(() => {
      loadLiveInbox(apiKey).catch(() => setConnection('error'));
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  const connectApi = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const apiKey = String(form.get('apiKey') ?? '').trim();
    try {
      await loadLiveInbox(apiKey);
      setConnectOpen(false);
    } catch (error) {
      setConnection('error');
      setConnectError(error instanceof Error ? error.message : 'Connection failed.');
    }
  };

  const copyAddress = async () => {
    await navigator.clipboard?.writeText(activeMessage.recipient);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <main style={palette} className="min-h-screen bg-[var(--brand-cream-deep)] p-0 text-[var(--brand-ink)] lg:p-3">
      <div className="mx-auto min-h-screen max-w-[1600px] overflow-hidden bg-[#FFFEFC] shadow-[0_8px_40px_rgba(28,25,23,0.08)] lg:min-h-[calc(100vh-24px)] lg:rounded-[22px] lg:border lg:border-[#1C1917]/10">
        <header className="flex h-16 items-center justify-between border-b border-[#1C1917]/10 bg-[var(--brand-cream)] px-4 sm:px-5">
          <div className="flex items-center gap-6">
            <Logo />
            <nav aria-label="Breadcrumb" className="hidden items-center gap-2 text-sm text-stone-500 md:flex">
              <span>Inboxes</span><span aria-hidden="true">/</span><span className="font-medium text-stone-900">{activeInbox.local_part}</span>
            </nav>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button type="button" onClick={() => setConnectOpen((open) => !open)} className="hidden items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs text-stone-600 sm:flex"><span className={`size-1.5 rounded-full ${connection === 'live' ? 'bg-emerald-500' : connection === 'loading' ? 'bg-amber-500' : 'bg-stone-400'}`} />{connection === 'live' ? `${usage.received} of ${usage.limit} emails` : connection === 'loading' ? 'Connecting…' : 'Connect API'}</button>
            <button aria-label="Open help" className="grid size-9 place-items-center rounded-full border border-stone-200 text-sm font-semibold text-stone-500 transition hover:bg-stone-50">?</button>
            <button aria-label="Open account menu" className="grid size-9 place-items-center rounded-full bg-[var(--brand-ink)] text-xs font-bold text-[#F7F4EF]">VS</button>
          </div>
        </header>

        <div className="grid min-h-[calc(100vh-64px)] grid-cols-1 md:grid-cols-[72px_330px_minmax(0,1fr)] lg:min-h-[calc(100vh-88px)]">
          <aside className="hidden flex-col items-center border-r border-[#1C1917]/10 bg-[var(--brand-cream)] py-4 md:flex">
            <nav aria-label="Primary navigation" className="flex flex-1 flex-col items-center gap-2">
              <button aria-label="Inboxes" className="grid size-10 place-items-center rounded-xl bg-[var(--brand-teal)] font-semibold text-[#F7F4EF]"><NavIcon>▱</NavIcon></button>
              <button aria-label="API keys" className="grid size-10 place-items-center rounded-xl text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"><NavIcon>⌁</NavIcon></button>
              <button aria-label="Usage" className="grid size-10 place-items-center rounded-xl text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"><NavIcon>⌁</NavIcon></button>
            </nav>
            <button aria-label="Settings" className="grid size-10 place-items-center rounded-xl text-stone-500 transition hover:bg-stone-100"><NavIcon>⚙</NavIcon></button>
          </aside>

          <section aria-label="Messages" className="hidden border-r border-[#1C1917]/10 bg-[var(--brand-cream)] md:block">
            <div className="border-b border-stone-200 px-5 pb-4 pt-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div><p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--brand-teal)]">Inbox</p><h1 className="mt-1 text-lg font-bold tracking-[-0.025em]">{activeInbox.local_part}</h1></div>
                <button aria-label="Inbox actions" className="grid size-8 place-items-center rounded-lg text-xl leading-none text-stone-400 hover:bg-stone-100">···</button>
              </div>
              <button type="button" onClick={copyAddress} className="flex w-full items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-left shadow-sm transition hover:border-stone-300">
                <span className="min-w-0 truncate font-mono text-[11px] text-stone-600">{activeInbox.address}</span>
                <span aria-live="polite" className="shrink-0 text-[11px] font-bold text-[var(--brand-teal)]">{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="flex items-center justify-between px-5 py-3 text-xs text-stone-500"><span>{displayMessages.length} messages</span><button className="font-semibold text-stone-600 hover:text-stone-900">Newest first⌄</button></div>
            <div role="list" className="space-y-1 px-2">
              {displayMessages.map((message) => {
                const isActive = activeMessage.id === message.id;
                return (
                  <div role="listitem" key={message.id}>
                    <button type="button" onClick={() => selectMessage(message.id)} aria-current={isActive ? 'true' : undefined} className={`w-full rounded-xl border px-3 py-3.5 text-left transition ${isActive ? 'border-[#0F3D3E]/25 bg-[#FFFEFC] shadow-sm' : 'border-transparent hover:bg-[#F4F1EA]'}`}>
                      <div className="flex items-center gap-2">
                        {message.unread ? <span aria-label="Unread" className="size-1.5 shrink-0 rounded-full bg-[var(--brand-teal)]" /> : null}
                        <span className={`min-w-0 flex-1 truncate text-sm ${message.unread ? 'font-bold' : 'font-semibold'}`}>{message.senderName}</span><time className="shrink-0 text-[11px] text-stone-500">{message.receivedAt}</time>
                      </div>
                      <p className={`mt-1 truncate text-[13px] ${message.unread ? 'font-semibold text-stone-800' : 'text-stone-700'}`}>{message.subject}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-stone-500">{message.preview}</p>
                      {message.attachments.length ? <span className="mt-2 inline-flex rounded-md bg-white/80 px-2 py-1 text-[10px] font-semibold text-stone-600">↳ {message.attachments.length} attachment</span> : null}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          <section aria-label="Message viewer" className="min-w-0 bg-white">
            {connectOpen ? <form onSubmit={connectApi} className="flex flex-col gap-2 border-b border-stone-200 bg-stone-50 px-4 py-3 sm:flex-row sm:items-center sm:px-7"><label htmlFor="api-key" className="shrink-0 text-xs font-bold text-stone-700">API key</label><input id="api-key" name="apiKey" type="password" autoComplete="off" placeholder="ir_live_…" className="min-w-0 flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 font-mono text-xs outline-none focus:border-[var(--brand-teal)]" /><button type="submit" className="rounded-lg bg-[var(--brand-teal)] px-4 py-2 text-xs font-bold text-white">Connect</button>{connectError ? <p role="alert" className="text-xs text-red-700">{connectError}</p> : null}</form> : null}
            <div className="border-b border-stone-200 px-4 py-4 sm:px-7 sm:py-5">
              <div className="mb-3 flex items-center justify-between gap-4 md:hidden"><button className="text-sm font-semibold text-[var(--brand-teal)]">← Messages</button><span className="text-xs text-stone-500">1 of {displayMessages.length}</span></div>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="mb-2 flex items-center gap-2"><span className="rounded-full bg-[#F4F1EA] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--brand-teal)]">Received</span><time className="text-xs text-stone-500">{activeMessage.dateLabel}</time></div>
                  <h2 className="truncate text-xl font-bold tracking-[-0.03em] text-stone-950 sm:text-2xl">{activeMessage.subject}</h2>
                  <button type="button" onClick={() => setDetailsOpen((open) => !open)} aria-expanded={detailsOpen} className="mt-3 flex items-center gap-2 text-left text-sm">
                    <span className="grid size-8 place-items-center rounded-full bg-[var(--brand-ink)] text-[11px] font-bold text-[#F7F4EF]">{activeMessage.senderName.slice(0, 2).toUpperCase()}</span>
                    <span><span className="font-semibold">{activeMessage.senderName}</span><span className="ml-1 text-stone-500">&lt;{activeMessage.senderEmail}&gt;</span></span><span aria-hidden="true" className="text-stone-400">⌄</span>
                  </button>
                </div>
                <div className="flex shrink-0 items-center gap-1"><button aria-label="Delete message" className="grid size-9 place-items-center rounded-lg border border-stone-200 text-sm text-stone-500 transition hover:bg-red-50 hover:text-red-700">⌫</button><button aria-label="More message actions" className="grid size-9 place-items-center rounded-lg border border-stone-200 text-lg text-stone-500 transition hover:bg-stone-50">···</button></div>
              </div>
              {detailsOpen ? (
                <dl className="mt-4 grid grid-cols-[60px_1fr] gap-x-3 gap-y-2 rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs">
                  <dt className="text-stone-500">From</dt><dd className="break-all font-mono">{activeMessage.senderEmail}</dd><dt className="text-stone-500">To</dt><dd className="break-all font-mono">{activeMessage.recipient}</dd><dt className="text-stone-500">Date</dt><dd>{activeMessage.dateLabel}</dd>
                </dl>
              ) : null}
            </div>

            <div className="flex items-center justify-between border-b border-stone-200 px-4 sm:px-7">
              <div role="tablist" aria-label="Message format" className="flex gap-5">
                {(['html', 'text', 'headers'] as Tab[]).map((tab) => (
                  <button key={tab} role="tab" type="button" aria-selected={activeTab === tab} onClick={() => setActiveTab(tab)} className={`border-b-2 py-3 text-xs font-bold capitalize transition ${activeTab === tab ? 'border-[var(--brand-teal)] text-[var(--brand-teal)]' : 'border-transparent text-stone-500 hover:text-stone-900'}`}>{tab}</button>
                ))}
              </div>
              {activeTab === 'html' ? <span className="hidden items-center gap-1.5 text-[11px] text-stone-500 sm:flex"><span className="size-1.5 rounded-full bg-emerald-500" /> Remote images blocked</span> : null}
            </div>

            <div className="bg-[var(--brand-cream-deep)] p-3 sm:p-6">
              {activeTab === 'html' ? (
                <div role="tabpanel" aria-label="HTML preview" className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
                  <div className="flex h-9 items-center justify-between border-b border-stone-200 bg-stone-50 px-3 text-[10px] font-medium text-stone-500"><span>Sandboxed preview</span><span>560 px</span></div>
                  <iframe key={activeMessage.id} title={`Rendered email: ${activeMessage.subject}`} sandbox="" referrerPolicy="no-referrer" srcDoc={createSafeEmailDocument(activeMessage.html)} className="h-[460px] w-full bg-white" />
                </div>
              ) : null}
              {activeTab === 'text' ? <div role="tabpanel" aria-label="Plain text content" className="min-h-[496px] rounded-xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7"><pre className="whitespace-pre-wrap break-words font-mono text-[13px] leading-7 text-stone-700">{activeMessage.text}</pre></div> : null}
              {activeTab === 'headers' ? (
                <div role="tabpanel" aria-label="Message headers" className="min-h-[496px] overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
                  <div className="border-b border-stone-200 px-5 py-4"><h3 className="text-sm font-bold">All headers</h3><p className="mt-1 text-xs text-stone-500">Repeated header names are preserved.</p></div>
                  <dl className="divide-y divide-stone-100">{activeMessage.headers.map(([name, value]) => <div key={`${name}-${value}`} className="grid gap-1 px-5 py-3 text-xs sm:grid-cols-[120px_1fr]"><dt className="font-semibold text-stone-500">{name}</dt><dd className="break-all font-mono leading-5 text-stone-700">{value}</dd></div>)}</dl>
                </div>
              ) : null}
              {activeMessage.attachments.length ? (
                <section aria-labelledby="attachments-heading" className="mt-4 rounded-xl border border-amber-200 bg-amber-50/80 p-4">
                  <div className="flex items-start justify-between gap-4"><div><h3 id="attachments-heading" className="text-sm font-bold text-amber-950">Attachments</h3><p className="mt-1 text-[11px] leading-5 text-amber-800">Files are not malware-scanned. Download only if you trust the sender.</p></div><button className="shrink-0 rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-amber-950 shadow-sm">Download</button></div>
                  <div className="mt-3 flex items-center gap-3 rounded-lg bg-white/70 p-3"><span className="grid size-9 place-items-center rounded-lg bg-red-100 text-[10px] font-black text-red-700">PDF</span><div><p className="text-xs font-semibold">{activeMessage.attachments[0].name}</p><p className="mt-0.5 text-[10px] text-stone-500">{activeMessage.attachments[0].size}</p></div></div>
                </section>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
