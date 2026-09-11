'use client';

import { type CSSProperties, type FormEvent } from 'react';
import { LogoIcon } from './brand-logo';
import { brandColors } from './brand';
import { createSafeEmailDocument, type Message } from './message-demo-data';

export type Panel = 'inboxes' | 'api-keys' | 'usage';
export type Tab = 'html' | 'text' | 'headers';
export type ApiInbox = { id: string; address: string; local_part: string };
export type ApiKeySummary = {
  id: string;
  name: string;
  prefix: string;
  created_at: string;
  last_used_at: string | null;
};

export type MessageViewerUIProps = {
  embed?: boolean;
  isLive: boolean;
  displayMessages: Message[];
  activeInbox: ApiInbox;
  usage: { received: number; limit: number; inboxes?: number; inboxLimit?: number };
  panel: Panel;
  activeMessage?: Message;
  activeTab: Tab;
  detailsOpen: boolean;
  copied: boolean;
  verified?: boolean;
  error?: string;
  accountLabel?: string;
  accountOpen?: boolean;
  loading?: boolean;
  messagesLoading?: boolean;
  refreshing?: boolean;
  lastUpdated?: string;
  detailError?: string;
  inboxes?: ApiInbox[];
  apiKeys?: ApiKeySummary[];
  newApiKey?: string | null;
  onAccountToggle?: () => void;
  onSignOut?: () => void;
  onResendVerification?: () => void;
  onRefreshVerification?: () => void;
  onPanelChange?: (panel: Panel) => void;
  onDeleteInbox?: () => void;
  onCopyAddress?: () => void;
  onCreateInbox?: (event: FormEvent<HTMLFormElement>) => void;
  onSelectInbox?: (inboxId: string) => void;
  onRefresh?: () => void;
  onSelectMessage?: (id: string) => void;
  onToggleDetails?: () => void;
  onDeleteMessage?: (messageId: string) => void;
  onTabChange?: (tab: Tab) => void;
  onRetryMessage?: () => void;
  onCreateApiKey?: (event: FormEvent<HTMLFormElement>) => void;
  onRevokeApiKey?: (keyId: string) => void;
  onDownloadAttachment?: (attachmentId: string, filename: string) => void;
};

function Logo() {
  return (
    <div className="flex items-center gap-2.5" aria-label="InboxRhino">
      <LogoIcon size={36} priority />
      <span className="hidden text-[15px] font-bold tracking-[-0.02em] text-[#1C1917] sm:block">InboxRhino</span>
    </div>
  );
}

export function MessageViewerUI(props: MessageViewerUIProps) {
  const palette = {
    '--brand-ink': brandColors.ink,
    '--brand-cream': brandColors.cream,
    '--brand-cream-deep': brandColors.creamDeep,
    '--brand-teal': brandColors.teal,
  } as CSSProperties;

  const navButtonClass = (target: Panel) =>
    `flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm transition md:w-full md:flex-none md:justify-start ${props.panel === target ? 'bg-[var(--brand-teal)] font-semibold text-[#F7F4EF]' : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900'}`;

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
              <span className="capitalize">{props.panel === 'inboxes' ? 'Mailboxes' : props.panel === 'api-keys' ? 'API Keys' : 'Usage'}</span>
              {props.panel === 'inboxes' ? (
                <>
                  <span aria-hidden="true">/</span>
                  <span className="font-medium text-stone-900">{props.activeInbox.local_part}</span>
                </>
              ) : null}
            </nav>
          </div>
          <div className="relative flex items-center gap-2 sm:gap-3">
            <span className="hidden items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs text-stone-600 sm:flex">
              <span className={`size-1.5 rounded-full ${props.isLive ? 'bg-emerald-500' : 'bg-stone-400'}`} />
              {props.usage.received} of {props.usage.limit} emails
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

        {!props.verified && props.isLive ? (
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
                <button key={target} type="button" aria-current={props.panel === target ? 'page' : undefined} className={navButtonClass(target)} onClick={() => props.onPanelChange?.(target)}>
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-5 shrink-0">
                    {target === 'inboxes' ? <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/></> : target === 'api-keys' ? <><circle cx="8" cy="8" r="5"/><path d="m12 12 9 9m-4-4 3-3m-6 0 3-3"/></> : <><path d="M4 20V10m8 10V4m8 16v-7M2 22h20"/></>}
                  </svg>
                  {target === 'inboxes' ? 'Mailboxes' : target === 'api-keys' ? 'API Keys' : 'Usage'}
                </button>
              ))}
            </nav>
          </aside>

          {props.panel === 'inboxes' ? (
            <section aria-label="Messages" className="min-w-0 border-b border-r border-[#1C1917]/10 bg-[var(--brand-cream)]">
              <div className="border-b border-stone-200 px-5 pb-4 pt-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--brand-teal)]">Inbox</p>
                    <p className="mt-1 text-lg font-bold tracking-[-0.025em]">{props.activeInbox.local_part}</p>
                  </div>
                  {props.isLive && props.onDeleteInbox && props.activeInbox.id !== 'none' ? (
                    <button type="button" aria-label="Delete inbox" onClick={props.onDeleteInbox} className="rounded-lg border border-red-200 px-2 py-1 text-[11px] font-bold text-red-700">
                      Delete
                    </button>
                  ) : null}
                </div>
                <button type="button" disabled={props.activeInbox.id === 'none'} onClick={props.onCopyAddress} className="flex w-full items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-left shadow-sm transition hover:border-stone-300">
                  <span className="min-w-0 truncate font-mono text-[11px] text-stone-600">{props.activeInbox.address}</span>
                  <span aria-live="polite" className="shrink-0 text-[11px] font-bold text-[var(--brand-teal)]">{props.copied ? 'Copied' : 'Copy'}</span>
                </button>
                {props.isLive && props.onCreateInbox ? (
                  <form onSubmit={props.onCreateInbox} className="mt-3 space-y-2">
                    <input aria-label="Mailbox prefix" name="prefix" placeholder="optional prefix" className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs outline-none focus:border-[var(--brand-teal)]" />
                    <button type="submit" className="w-full rounded-lg bg-[var(--brand-teal)] px-3 py-2 text-xs font-bold text-white">Create mailbox</button>
                  </form>
                ) : null}
                {props.isLive && props.inboxes && props.inboxes.length > 1 ? (
                  <div className="mt-3 space-y-1">
                    {props.inboxes.map((inbox) => (
                      <button key={inbox.id} type="button" aria-pressed={inbox.id === props.activeInbox.id} title={inbox.address} onClick={() => props.onSelectInbox?.(inbox.id)} className={`block w-full truncate rounded-lg px-2 py-1 text-left text-xs ${inbox.id === props.activeInbox.id ? 'bg-white font-bold' : 'hover:bg-white/70'}`}>
                        {inbox.local_part}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="flex items-center justify-between gap-2 px-5 py-3 text-xs text-stone-500">
                <span>{props.displayMessages.length} messages</span>
                {props.isLive ? <button type="button" onClick={props.onRefresh} className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-semibold text-[var(--brand-teal)]">{props.refreshing ? 'Refreshing…' : 'Refresh'}</button> : null}
              </div>
              {props.isLive ? <p role="status" className="px-5 pb-3 text-xs text-stone-500">{props.lastUpdated ? `Updated ${props.lastUpdated} · Auto-refresh every 5s` : props.messagesLoading || props.loading ? 'Loading mailboxes…' : 'Auto-refresh every 5s'}</p> : null}
              <div role="list" className="max-h-80 space-y-1 overflow-y-auto px-2 md:max-h-[65vh]">
                {props.displayMessages.map((message) => {
                  const isActive = props.activeMessage?.id === message.id;
                  return (
                    <div role="listitem" key={message.id}>
                      <button type="button" onClick={() => props.onSelectMessage?.(message.id)} aria-current={isActive ? 'true' : undefined} className={`w-full rounded-xl border px-3 py-3.5 text-left transition ${isActive ? 'border-[#0F3D3E]/25 bg-[#FFFEFC] shadow-sm' : 'border-transparent hover:bg-[#F4F1EA]'}`}>
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
              {props.panel === 'usage' ? (
                <div className="space-y-4 text-sm">
                  <h2 className="text-lg font-bold">Usage</h2>
                  <p>Emails: {props.usage.received} / {props.usage.limit}</p>
                  <p>Inboxes: {props.usage.inboxes ?? 0} / {props.usage.inboxLimit ?? 11}</p>
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

          <section aria-label="Message viewer" className={`min-w-0 bg-white ${props.panel !== 'inboxes' ? 'hidden' : ''}`}>
            {props.panel !== 'inboxes' ? (
              <div className="grid min-h-[420px] place-items-center p-8 text-sm text-stone-500">Select Inboxes to read messages.</div>
            ) : props.activeMessage ? (
              <>
                <div className="border-b border-stone-200 px-4 py-4 sm:px-7 sm:py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="rounded-full bg-[#F4F1EA] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--brand-teal)]">Received</span>
                        <time className="text-xs text-stone-500">{props.activeMessage.dateLabel}</time>
                      </div>
                      <h2 className="truncate text-xl font-bold tracking-[-0.03em] text-stone-950 sm:text-2xl">{props.activeMessage.subject}</h2>
                      <button type="button" onClick={props.onToggleDetails} aria-expanded={props.detailsOpen} className="mt-3 flex items-center gap-2 text-left text-sm">
                        <span className="grid size-8 place-items-center rounded-full bg-[var(--brand-ink)] text-[11px] font-bold text-[#F7F4EF]">{props.activeMessage.senderName.slice(0, 2).toUpperCase()}</span>
                        <span><span className="font-semibold">{props.activeMessage.senderName}</span><span className="ml-1 text-stone-500">&lt;{props.activeMessage.senderEmail}&gt;</span></span>
                      </button>
                    </div>
                    {props.isLive && props.onDeleteMessage ? (
                      <button type="button" aria-label="Delete message" onClick={() => props.onDeleteMessage?.(props.activeMessage!.id)} className="grid size-9 place-items-center rounded-lg border border-stone-200 text-sm text-stone-500 transition hover:bg-red-50 hover:text-red-700">⌫</button>
                    ) : null}
                  </div>
                  {props.detailsOpen ? (
                    <dl className="mt-4 grid grid-cols-[60px_1fr] gap-x-3 gap-y-2 rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs">
                      <dt className="text-stone-500">From</dt><dd className="break-all font-mono">{props.activeMessage.senderEmail}</dd>
                      <dt className="text-stone-500">To</dt><dd className="break-all font-mono">{props.activeMessage.recipient}</dd>
                      <dt className="text-stone-500">Date</dt><dd>{props.activeMessage.dateLabel}</dd>
                    </dl>
                  ) : null}
                </div>

                <div className="flex items-center justify-between border-b border-stone-200 px-4 sm:px-7">
                  <div role="tablist" aria-label="Message format" className="flex gap-5">
                    {(['html', 'text', 'headers'] as Tab[]).map((tab) => (
                      <button key={tab} role="tab" type="button" aria-selected={props.activeTab === tab} onClick={() => props.onTabChange?.(tab)} className={`border-b-2 py-3 text-xs font-bold capitalize transition ${props.activeTab === tab ? 'border-[var(--brand-teal)] text-[var(--brand-teal)]' : 'border-transparent text-stone-500 hover:text-stone-900'}`}>{tab}</button>
                    ))}
                  </div>
                </div>

                <div className="bg-[var(--brand-cream-deep)] p-3 sm:p-6">
                  {props.isLive && props.detailError ? (
                    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">{props.detailError} <button type="button" onClick={props.onRetryMessage} className="font-bold underline">Retry email</button></div>
                  ) : props.isLive && !props.activeMessage.contentLoaded ? <p role="status" className="p-5 text-sm text-stone-500">Loading email…</p> : <>
                  {props.activeTab === 'html' && !props.activeMessage.html ? (
                    <div className="rounded-xl border border-stone-200 bg-white p-5"><p className="mb-4 text-sm text-stone-500">This email contains plain text only.</p><pre className="whitespace-pre-wrap break-words text-sm">{props.activeMessage.text}</pre></div>
                  ) : props.activeTab === 'html' ? (
                    <div role="tabpanel" aria-label="HTML preview" className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
                      <iframe key={props.activeMessage.id} title={`Rendered email: ${props.activeMessage.subject}`} sandbox="" referrerPolicy="no-referrer" srcDoc={createSafeEmailDocument(props.activeMessage.html)} className="h-[460px] w-full bg-white" />
                    </div>
                  ) : null}
                  {props.activeTab === 'text' ? (
                    <div role="tabpanel" aria-label="Plain text content" className="min-h-[496px] rounded-xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7">
                      <pre className="whitespace-pre-wrap break-words font-mono text-[13px] leading-7 text-stone-700">{props.activeMessage.text}</pre>
                    </div>
                  ) : null}
                  {props.activeTab === 'headers' ? (
                    <div role="tabpanel" aria-label="Message headers" className="min-h-[496px] overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
                      <dl className="divide-y divide-stone-100">
                        {props.activeMessage.headers.map(([name, value]) => (
                          <div key={`${name}-${value}`} className="grid gap-1 px-5 py-3 text-xs sm:grid-cols-[120px_1fr]">
                            <dt className="font-semibold text-stone-500">{name}</dt>
                            <dd className="break-all font-mono leading-5 text-stone-700">{value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  ) : null}
                  {props.activeMessage.attachments.length ? (
                    <section aria-labelledby="attachments-heading" className="mt-4 rounded-xl border border-amber-200 bg-amber-50/80 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 id="attachments-heading" className="text-sm font-bold text-amber-950">Attachments</h3>
                          <p className="mt-1 text-[11px] leading-5 text-amber-800">Files are not malware-scanned. Download only if you trust the sender.</p>
                        </div>
                      </div>
                      {props.activeMessage.attachments.map((attachment, index) => (
                        <div key={attachment.id ?? index} className="mt-3 flex items-center gap-3 rounded-lg bg-white/70 p-3">
                          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-amber-100 text-xs font-bold text-amber-900">{attachment.type}</span>
                          <div className="min-w-0 flex-1">
                            <p className="break-all text-sm font-semibold">{attachment.name}</p>
                            <p className="mt-0.5 text-xs text-stone-500">{attachment.size}</p>
                          </div>
                          {props.isLive && props.onDownloadAttachment && attachment.id ? (
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
                <div><h2 className="text-xl font-semibold text-stone-900">{props.loading || props.messagesLoading ? 'Loading messages…' : props.error ? 'Messages unavailable' : props.activeInbox.id === 'none' ? 'No mailboxes yet' : 'Waiting for email'}</h2>
                <p className="mt-3">{props.error ? 'Use Refresh to try again.' : props.activeInbox.id === 'none' ? 'Create a mailbox to receive your first test email.' : `Send an email to ${props.activeInbox.address}. New messages appear automatically.`}</p></div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
