'use client';

import { type CSSProperties, type FormEvent, useState } from 'react';
import { LogoIcon } from './brand-logo';
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
  contentLoaded?: boolean;
  html: string;
  text: string;
  headers: Array<[string, string]>;
  attachments: Array<{ id?: string; name: string; size: string; type: string }>;
};

type Panel = 'inboxes' | 'api-keys' | 'usage';
type Tab = 'html' | 'text' | 'headers';

type ApiInbox = { id: string; address: string; local_part: string };

type ApiKeySummary = {
  id: string;
  name: string;
  prefix: string;
  created_at: string;
  last_used_at: string | null;
};

export type MessageViewerProps = {
  mode?: 'demo' | 'live';
  loading?: boolean;
  messagesLoading?: boolean;
  refreshing?: boolean;
  lastUpdated?: string;
  onRefresh?: () => void;
  selectedMessageId?: string | null;
  onSelectMessage?: (id: string) => void;
  detailError?: string;
  onRetryMessage?: () => void;
  onRefreshVerification?: () => void;
  displayMessages?: Message[];
  activeInbox?: ApiInbox;
  inboxes?: ApiInbox[];
  usage?: { received: number; limit: number; inboxes?: number; inboxLimit?: number };
  verified?: boolean;
  panel?: Panel;
  onPanelChange?: (panel: Panel) => void;
  error?: string;
  accountLabel?: string;
  accountOpen?: boolean;
  onAccountToggle?: () => void;
  onSignOut?: () => void;
  onResendVerification?: () => void;
  onCreateInbox?: (event: FormEvent<HTMLFormElement>) => void;
  onDeleteInbox?: () => void;
  onDeleteMessage?: (messageId: string) => void;
  onDownloadAttachment?: (attachmentId: string, filename: string) => void;
  apiKeys?: ApiKeySummary[];
  newApiKey?: string | null;
  onCreateApiKey?: (event: FormEvent<HTMLFormElement>) => void;
  onRevokeApiKey?: (keyId: string) => void;
  onSelectInbox?: (inboxId: string) => void;
  embed?: boolean;
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
    html: `<!doctype html><html><body style="margin:0;background:#f7f4ef;color:#1c1917;font-family:Arial,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:42px 20px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fff;border:1px solid #e7e5e4;border-radius:18px"><tr><td style="padding:36px"><div style="font-size:14px;font-weight:700;letter-spacing:.08em;color:#0f3d3e">ACME</div><h1 style="font-size:28px;line-height:1.2;margin:32px 0 14px">Verify your email address</h1><p style="font-size:16px;line-height:1.65;color:#57534e;margin:0 0 28px">Welcome to Acme. Confirm your email address to finish setting up your account.</p><a href="#" style="display:inline-block;background:#0f3d3e;color:white;text-decoration:none;font-weight:700;padding:14px 20px;border-radius:9px">Verify email</a><p style="font-size:13px;line-height:1.5;color:#78716c;margin:30px 0 0">This link expires in 30 minutes. If you didn't create this account, you can safely ignore this email.</p></td></tr></table></td></tr></table></body></html>`,
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

export const emailPreviewCsp =
  "default-src 'none'; img-src data: blob:; style-src 'unsafe-inline'; font-src data:; form-action 'none'; base-uri 'none';";

export function createSafeEmailDocument(html: string) {
  const securityHead = `<meta http-equiv="Content-Security-Policy" content="${emailPreviewCsp}"><meta name="referrer" content="no-referrer">`;
  if (/<head[\s>]/i.test(html)) return html.replace(/<head([^>]*)>/i, `<head$1>${securityHead}`);
  if (/<html[\s>]/i.test(html)) return html.replace(/<html([^>]*)>/i, `<html$1><head>${securityHead}</head>`);
  return `<!doctype html><html><head>${securityHead}</head><body>${html}</body></html>`;
}

function Logo() {
  return (
    <div className="flex items-center gap-2.5" aria-label="InboxRhino">
      <LogoIcon size={36} priority />
      <span className="hidden text-[15px] font-bold tracking-[-0.02em] text-[#1C1917] sm:block">InboxRhino</span>
    </div>
  );
}



export function MessageViewer(props: MessageViewerProps = {}) {
  const isLive = props.mode === 'live';
  const displayMessages = props.displayMessages ?? (isLive ? [] : messages);
  const activeInbox = props.activeInbox ?? (isLive ? { id: 'none', address: 'Create a mailbox to begin', local_part: 'No mailbox selected' } : {
    id: 'demo',
    address: messages[0].recipient,
    local_part: messages[0].recipient.split('@')[0],
  });
  const usage = props.usage ?? { received: 0, limit: 33, inboxes: 0, inboxLimit: 11 };
  const panel = props.panel ?? 'inboxes';
  const [activeId, setActiveId] = useState(displayMessages[0]?.id);
  const [activeTab, setActiveTab] = useState<Tab>('html');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const selectedId = props.selectedMessageId !== undefined ? props.selectedMessageId : activeId;
  const resolvedActiveId = displayMessages.some((message) => message.id === selectedId)
    ? selectedId
    : displayMessages[0]?.id;
  const activeMessage = displayMessages.find((message) => message.id === resolvedActiveId);

  const palette = {
    '--brand-ink': brandColors.ink,
    '--brand-cream': brandColors.cream,
    '--brand-cream-deep': brandColors.creamDeep,
    '--brand-teal': brandColors.teal,
  } as CSSProperties;

  const selectMessage = (messageId: string) => {
    setActiveId(messageId);
    props.onSelectMessage?.(messageId);
    setActiveTab('html');
    setDetailsOpen(false);
  };

  const copyAddress = async () => {
    await navigator.clipboard?.writeText(activeInbox.address);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const navButtonClass = (target: Panel) =>
    `flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm transition md:w-full md:flex-none md:justify-start ${panel === target ? 'bg-[var(--brand-teal)] font-semibold text-[#F7F4EF]' : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900'}`;

  return (
    <main
      style={palette}
      className={
        props.embed
          ? 'h-[680px] overflow-hidden bg-[var(--brand-cream-deep)] p-0 text-[var(--brand-ink)]'
          : 'min-h-screen bg-[var(--brand-cream-deep)] p-0 text-[var(--brand-ink)] lg:p-3'
      }
    >
      <div
        className={
          props.embed
            ? 'h-full overflow-hidden bg-[#FFFEFC]'
            : 'mx-auto min-h-screen max-w-[1600px] overflow-hidden bg-[#FFFEFC] shadow-[0_8px_40px_rgba(28,25,23,0.08)] lg:min-h-[calc(100vh-24px)] lg:rounded-[22px] lg:border lg:border-[#1C1917]/10'
        }
      >
        <header className="flex h-16 items-center justify-between border-b border-[#1C1917]/10 bg-[var(--brand-cream)] px-4 sm:px-5">
          <div className="flex items-center gap-6">
            <Logo />
            <nav aria-label="Breadcrumb" className="hidden items-center gap-2 text-sm text-stone-500 md:flex">
              <span className="capitalize">{panel === 'inboxes' ? 'Mailboxes' : panel === 'api-keys' ? 'API Keys' : 'Usage'}</span>
              {panel === 'inboxes' ? (
                <>
                  <span aria-hidden="true">/</span>
                  <span className="font-medium text-stone-900">{activeInbox.local_part}</span>
                </>
              ) : null}
            </nav>
          </div>
          <div className="relative flex items-center gap-2 sm:gap-3">
            <span className="hidden items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs text-stone-600 sm:flex">
              <span className={`size-1.5 rounded-full ${isLive ? 'bg-emerald-500' : 'bg-stone-400'}`} />
              {usage.received} of {usage.limit} emails
            </span>
            <button type="button" aria-label="Open account menu" onClick={props.onAccountToggle} className="grid size-9 place-items-center rounded-full bg-[var(--brand-ink)] text-xs font-bold text-[#F7F4EF]">
              {props.accountLabel ?? 'IR'}
            </button>
            {props.accountOpen ? (
              <div className="absolute right-0 top-12 z-20 w-48 rounded-xl border border-stone-200 bg-white p-2 shadow-lg">
                <button type="button" onClick={props.onSignOut} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-stone-50">
                  Sign out
                </button>
              </div>
            ) : null}
          </div>
        </header>

        {!props.verified && isLive ? (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 sm:px-5">
            Verify your email address to create inboxes and API keys.{' '}
            <button type="button" onClick={props.onResendVerification} className="font-bold underline">
              Resend verification email
            </button>{' '}
            <button type="button" onClick={props.onRefreshVerification} className="ml-3 font-bold underline">I’ve verified my email</button>
          </div>
        ) : null}
        {props.error ? <div role="alert" className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 sm:px-5">{props.error}</div> : null}

        <div className="grid min-h-[calc(100vh-64px)] grid-cols-1 md:grid-cols-[160px_280px_minmax(0,1fr)] lg:grid-cols-[180px_320px_minmax(0,1fr)] lg:min-h-[calc(100vh-88px)]">
          <aside className="flex border-b border-r border-[#1C1917]/10 bg-[var(--brand-cream)] p-2 md:flex-col md:py-4">
            <nav aria-label="Primary navigation" className="flex flex-1 gap-1 md:flex-col md:gap-2">
              {(['inboxes', 'api-keys', 'usage'] as Panel[]).map((target) => (
                <button key={target} type="button" aria-current={panel === target ? 'page' : undefined} className={navButtonClass(target)} onClick={() => props.onPanelChange?.(target)}>
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-5 shrink-0">
                    {target === 'inboxes' ? <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/></> : target === 'api-keys' ? <><circle cx="8" cy="8" r="5"/><path d="m12 12 9 9m-4-4 3-3m-6 0 3-3"/></> : <><path d="M4 20V10m8 10V4m8 16v-7M2 22h20"/></>}
                  </svg>
                  {target === 'inboxes' ? 'Mailboxes' : target === 'api-keys' ? 'API Keys' : 'Usage'}
                </button>
              ))}
            </nav>
          </aside>

          {panel === 'inboxes' ? (
            <section aria-label="Messages" className="min-w-0 border-b border-r border-[#1C1917]/10 bg-[var(--brand-cream)]">
              <div className="border-b border-stone-200 px-5 pb-4 pt-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--brand-teal)]">Inbox</p>
                    <p className="mt-1 text-lg font-bold tracking-[-0.025em]">{activeInbox.local_part}</p>
                  </div>
                  {isLive && props.onDeleteInbox && activeInbox.id !== 'none' ? (
                    <button type="button" aria-label="Delete inbox" onClick={props.onDeleteInbox} className="rounded-lg border border-red-200 px-2 py-1 text-[11px] font-bold text-red-700">
                      Delete
                    </button>
                  ) : null}
                </div>
                <button type="button" disabled={activeInbox.id === 'none'} onClick={copyAddress} className="flex w-full items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-left shadow-sm transition hover:border-stone-300">
                  <span className="min-w-0 truncate font-mono text-[11px] text-stone-600">{activeInbox.address}</span>
                  <span aria-live="polite" className="shrink-0 text-[11px] font-bold text-[var(--brand-teal)]">{copied ? 'Copied' : 'Copy'}</span>
                </button>
                {isLive && props.onCreateInbox ? (
                  <form onSubmit={props.onCreateInbox} className="mt-3 space-y-2">
                    <input aria-label="Mailbox prefix" name="prefix" placeholder="optional prefix" className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs outline-none focus:border-[var(--brand-teal)]" />
                    <button type="submit" className="w-full rounded-lg bg-[var(--brand-teal)] px-3 py-2 text-xs font-bold text-white">Create mailbox</button>
                  </form>
                ) : null}
                {isLive && props.inboxes && props.inboxes.length > 1 ? (
                  <div className="mt-3 space-y-1">
                    {props.inboxes.map((inbox) => (
                      <button key={inbox.id} type="button" aria-pressed={inbox.id === activeInbox.id} title={inbox.address} onClick={() => props.onSelectInbox?.(inbox.id)} className={`block w-full truncate rounded-lg px-2 py-1 text-left text-xs ${inbox.id === activeInbox.id ? 'bg-white font-bold' : 'hover:bg-white/70'}`}>
                        {inbox.local_part}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="flex items-center justify-between gap-2 px-5 py-3 text-xs text-stone-500">
                <span>{displayMessages.length} messages</span>
                {isLive ? <button type="button" onClick={props.onRefresh} className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-semibold text-[var(--brand-teal)]">{props.refreshing ? 'Refreshing…' : 'Refresh'}</button> : null}
              </div>
              {isLive ? <p role="status" className="px-5 pb-3 text-xs text-stone-500">{props.lastUpdated ? `Updated ${props.lastUpdated} · Auto-refresh every 5s` : props.messagesLoading || props.loading ? 'Loading mailboxes…' : 'Auto-refresh every 5s'}</p> : null}
              <div role="list" className="max-h-80 space-y-1 overflow-y-auto px-2 md:max-h-[65vh]">
                {displayMessages.map((message) => {
                  const isActive = activeMessage?.id === message.id;
                  return (
                    <div role="listitem" key={message.id}>
                      <button type="button" onClick={() => selectMessage(message.id)} aria-current={isActive ? 'true' : undefined} className={`w-full rounded-xl border px-3 py-3.5 text-left transition ${isActive ? 'border-[#0F3D3E]/25 bg-[#FFFEFC] shadow-sm' : 'border-transparent hover:bg-[#F4F1EA]'}`}>
                        <div className="flex items-center gap-2">
                          {message.unread ? <span aria-label="Unread" className="size-1.5 shrink-0 rounded-full bg-[var(--brand-teal)]" /> : null}
                          <span className={`min-w-0 flex-1 truncate text-sm ${message.unread ? 'font-bold' : 'font-semibold'}`}>{message.senderName}</span>
                          <time className="shrink-0 text-[11px] text-stone-500">{message.receivedAt}</time>
                        </div>
                        <p className={`mt-1 truncate text-[13px] ${message.unread ? 'font-semibold text-stone-800' : 'text-stone-700'}`}>{message.subject}</p>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-stone-500">{message.preview}</p>
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : (
            <section aria-label="Console panel" className="min-w-0 border-r border-[#1C1917]/10 bg-[var(--brand-cream)] p-5 md:col-span-2">
              {panel === 'usage' ? (
                <div className="space-y-4 text-sm">
                  <h2 className="text-lg font-bold">Usage</h2>
                  <p>Emails: {usage.received} / {usage.limit}</p>
                  <p>Inboxes: {usage.inboxes ?? 0} / {usage.inboxLimit ?? 11}</p>
                </div>
              ) : (
                <div className="space-y-4 text-sm">
                  <h2 className="text-lg font-bold">API keys</h2>
                  {props.newApiKey ? (
                    <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs">
                      <p className="font-bold text-amber-950">Copy this key now. It will not be shown again.</p>
                      <code className="mt-2 block break-all font-mono">{props.newApiKey}</code>
                    </div>
                  ) : null}
                  {props.onCreateApiKey ? (
                    <form onSubmit={props.onCreateApiKey} className="space-y-2">
                      <input aria-label="API key name" name="name" placeholder="Key name" className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs" />
                      <button type="submit" className="w-full rounded-lg bg-[var(--brand-teal)] px-3 py-2 text-xs font-bold text-white">Create API key</button>
                    </form>
                  ) : null}
                  <div className="space-y-2">
                    {(props.apiKeys ?? []).map((key) => (
                      <div key={key.id} className="rounded-lg border border-stone-200 bg-white p-3">
                        <p className="font-semibold">{key.name}</p>
                        <p className="mt-1 font-mono text-[11px] text-stone-600">{key.prefix}_…</p>
                        {props.onRevokeApiKey ? (
                          <button type="button" onClick={() => props.onRevokeApiKey?.(key.id)} className="mt-2 text-[11px] font-bold text-red-700">
                            Revoke
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          <section aria-label="Message viewer" className={`min-w-0 bg-white ${panel !== 'inboxes' ? 'hidden' : ''}`}>
            {panel !== 'inboxes' ? (
              <div className="grid min-h-[420px] place-items-center p-8 text-sm text-stone-500">Select Inboxes to read messages.</div>
            ) : activeMessage ? (
              <>
                <div className="border-b border-stone-200 px-4 py-4 sm:px-7 sm:py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="rounded-full bg-[#F4F1EA] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--brand-teal)]">Received</span>
                        <time className="text-xs text-stone-500">{activeMessage.dateLabel}</time>
                      </div>
                      <h2 className="truncate text-xl font-bold tracking-[-0.03em] text-stone-950 sm:text-2xl">{activeMessage.subject}</h2>
                      <button type="button" onClick={() => setDetailsOpen((open) => !open)} aria-expanded={detailsOpen} className="mt-3 flex items-center gap-2 text-left text-sm">
                        <span className="grid size-8 place-items-center rounded-full bg-[var(--brand-ink)] text-[11px] font-bold text-[#F7F4EF]">{activeMessage.senderName.slice(0, 2).toUpperCase()}</span>
                        <span><span className="font-semibold">{activeMessage.senderName}</span><span className="ml-1 text-stone-500">&lt;{activeMessage.senderEmail}&gt;</span></span>
                      </button>
                    </div>
                    {isLive && props.onDeleteMessage ? (
                      <button type="button" aria-label="Delete message" onClick={() => props.onDeleteMessage?.(activeMessage.id)} className="grid size-9 place-items-center rounded-lg border border-stone-200 text-sm text-stone-500 transition hover:bg-red-50 hover:text-red-700">⌫</button>
                    ) : null}
                  </div>
                  {detailsOpen ? (
                    <dl className="mt-4 grid grid-cols-[60px_1fr] gap-x-3 gap-y-2 rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs">
                      <dt className="text-stone-500">From</dt><dd className="break-all font-mono">{activeMessage.senderEmail}</dd>
                      <dt className="text-stone-500">To</dt><dd className="break-all font-mono">{activeMessage.recipient}</dd>
                      <dt className="text-stone-500">Date</dt><dd>{activeMessage.dateLabel}</dd>
                    </dl>
                  ) : null}
                </div>

                <div className="flex items-center justify-between border-b border-stone-200 px-4 sm:px-7">
                  <div role="tablist" aria-label="Message format" className="flex gap-5">
                    {(['html', 'text', 'headers'] as Tab[]).map((tab) => (
                      <button key={tab} role="tab" type="button" aria-selected={activeTab === tab} onClick={() => setActiveTab(tab)} className={`border-b-2 py-3 text-xs font-bold capitalize transition ${activeTab === tab ? 'border-[var(--brand-teal)] text-[var(--brand-teal)]' : 'border-transparent text-stone-500 hover:text-stone-900'}`}>{tab}</button>
                    ))}
                  </div>
                </div>

                <div className="bg-[var(--brand-cream-deep)] p-3 sm:p-6">
                  {isLive && props.detailError ? (
                    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">{props.detailError} <button type="button" onClick={props.onRetryMessage} className="font-bold underline">Retry email</button></div>
                  ) : isLive && !activeMessage.contentLoaded ? <p role="status" className="p-5 text-sm text-stone-500">Loading email…</p> : <>
                  {activeTab === 'html' && !activeMessage.html ? (
                    <div className="rounded-xl border border-stone-200 bg-white p-5"><p className="mb-4 text-sm text-stone-500">This email contains plain text only.</p><pre className="whitespace-pre-wrap break-words text-sm">{activeMessage.text}</pre></div>
                  ) : activeTab === 'html' ? (
                    <div role="tabpanel" aria-label="HTML preview" className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
                      <iframe key={activeMessage.id} title={`Rendered email: ${activeMessage.subject}`} sandbox="" referrerPolicy="no-referrer" srcDoc={createSafeEmailDocument(activeMessage.html)} className="h-[460px] w-full bg-white" />
                    </div>
                  ) : null}
                  {activeTab === 'text' ? (
                    <div role="tabpanel" aria-label="Plain text content" className="min-h-[496px] rounded-xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7">
                      <pre className="whitespace-pre-wrap break-words font-mono text-[13px] leading-7 text-stone-700">{activeMessage.text}</pre>
                    </div>
                  ) : null}
                  {activeTab === 'headers' ? (
                    <div role="tabpanel" aria-label="Message headers" className="min-h-[496px] overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
                      <dl className="divide-y divide-stone-100">
                        {activeMessage.headers.map(([name, value]) => (
                          <div key={`${name}-${value}`} className="grid gap-1 px-5 py-3 text-xs sm:grid-cols-[120px_1fr]">
                            <dt className="font-semibold text-stone-500">{name}</dt>
                            <dd className="break-all font-mono leading-5 text-stone-700">{value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  ) : null}
                  {activeMessage.attachments.length ? (
                    <section aria-labelledby="attachments-heading" className="mt-4 rounded-xl border border-amber-200 bg-amber-50/80 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 id="attachments-heading" className="text-sm font-bold text-amber-950">Attachments</h3>
                          <p className="mt-1 text-[11px] leading-5 text-amber-800">Files are not malware-scanned. Download only if you trust the sender.</p>
                        </div>
                      </div>
                      {activeMessage.attachments.map((attachment, index) => (
                        <div key={attachment.id ?? index} className="mt-3 flex items-center gap-3 rounded-lg bg-white/70 p-3">
                          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-amber-100 text-xs font-bold text-amber-900">{attachment.type}</span>
                          <div className="min-w-0 flex-1">
                            <p className="break-all text-sm font-semibold">{attachment.name}</p>
                            <p className="mt-0.5 text-xs text-stone-500">{attachment.size}</p>
                          </div>
                          {isLive && props.onDownloadAttachment && attachment.id ? (
                            <button type="button" aria-label={`Download ${attachment.name}`} onClick={() => props.onDownloadAttachment?.(attachment.id!, attachment.name)} className="shrink-0 rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-bold text-amber-950">Download</button>
                          ) : null}
                        </div>
                      ))}
                    </section>
                  ) : null}
                  </>}
                </div>
              </>
            ) : (
              <div role="status" className="grid min-h-[320px] place-items-center p-8 text-center text-sm text-stone-500">
                <div><h2 className="text-xl font-semibold text-stone-900">{props.loading || props.messagesLoading ? 'Loading messages…' : props.error ? 'Messages unavailable' : activeInbox.id === 'none' ? 'No mailboxes yet' : 'Waiting for email'}</h2>
                <p className="mt-3">{props.error ? 'Use Refresh to try again.' : activeInbox.id === 'none' ? 'Create a mailbox to receive your first test email.' : `Send an email to ${activeInbox.address}. New messages appear automatically.`}</p></div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
