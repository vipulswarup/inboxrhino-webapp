import { type CSSProperties } from 'react';
import { LogoIcon } from './brand-logo';
import { brandColors } from './brand';
import { createSafeEmailDocument, messages } from './message-demo-data';

export function MarketingMailboxDemo() {
  const active = messages[0];
  const localPart = active.recipient.split('@')[0];
  const palette = {
    '--brand-ink': brandColors.ink,
    '--brand-cream': brandColors.cream,
    '--brand-cream-deep': brandColors.creamDeep,
    '--brand-teal': brandColors.teal,
  } as CSSProperties;

  return (
    <div
      style={palette}
      className="h-[680px] overflow-hidden bg-[var(--brand-cream-deep)] p-0 text-[var(--brand-ink)]"
    >
      <div className="h-full overflow-hidden bg-[#FFFEFC]">
        <header className="flex h-16 items-center justify-between border-b border-[#1C1917]/10 bg-[var(--brand-cream)] px-4 sm:px-5">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5" aria-label="InboxRhino">
              <LogoIcon size={36} priority />
              <span className="hidden text-[15px] font-bold tracking-[-0.02em] text-[#1C1917] sm:block">InboxRhino</span>
            </div>
            <nav aria-label="Breadcrumb" className="hidden items-center gap-2 text-sm text-stone-500 md:flex">
              <span>Mailboxes</span>
              <span aria-hidden="true">/</span>
              <span className="font-medium text-stone-900">{localPart}</span>
            </nav>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs text-stone-600 sm:flex">
              <span className="size-1.5 rounded-full bg-stone-400" />
              0 of 33 emails
            </span>
            <span className="grid size-9 place-items-center rounded-full bg-[var(--brand-ink)] text-xs font-bold text-[#F7F4EF]">IR</span>
          </div>
        </header>

        <div className="grid min-h-[calc(100vh-64px)] grid-cols-1 md:grid-cols-[160px_280px_minmax(0,1fr)] lg:grid-cols-[180px_320px_minmax(0,1fr)] lg:min-h-[calc(100vh-88px)]">
          <aside className="flex border-b border-r border-[#1C1917]/10 bg-[var(--brand-cream)] p-2 md:flex-col md:py-4">
            <nav aria-label="Primary navigation" className="flex flex-1 gap-1 md:flex-col md:gap-2">
              <span className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--brand-teal)] px-3 py-3 text-sm font-semibold text-[#F7F4EF] md:w-full md:flex-none md:justify-start">Mailboxes</span>
              <span className="flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm text-stone-500 md:w-full md:flex-none md:justify-start">API Keys</span>
              <span className="flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm text-stone-500 md:w-full md:flex-none md:justify-start">Usage</span>
            </nav>
          </aside>

          <section aria-label="Messages" className="min-w-0 border-b border-r border-[#1C1917]/10 bg-[var(--brand-cream)]">
            <div className="border-b border-stone-200 px-5 pb-4 pt-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--brand-teal)]">Inbox</p>
              <p className="mt-1 text-lg font-bold tracking-[-0.025em]">{localPart}</p>
              <p className="mt-4 truncate rounded-xl border border-stone-200 bg-white px-3 py-2.5 font-mono text-[11px] text-stone-600">{active.recipient}</p>
            </div>
            <p className="px-5 py-3 text-xs text-stone-500">{messages.length} messages</p>
            <div role="list" className="max-h-80 space-y-1 overflow-y-auto px-2 md:max-h-[65vh]">
              {messages.map((message) => {
                const isActive = message.id === active.id;
                return (
                  <div role="listitem" key={message.id}>
                    <div className={`w-full rounded-xl border px-3 py-3.5 ${isActive ? 'border-[#0F3D3E]/25 bg-[#FFFEFC] shadow-sm' : 'border-transparent'}`}>
                      <div className="flex items-center gap-2">
                        {message.unread ? <span aria-label="Unread" className="size-1.5 shrink-0 rounded-full bg-[var(--brand-teal)]" /> : null}
                        <span className={`min-w-0 flex-1 truncate text-sm ${message.unread ? 'font-bold' : 'font-semibold'}`}>{message.senderName}</span>
                        <time className="shrink-0 text-[11px] text-stone-500">{message.receivedAt}</time>
                      </div>
                      <p className={`mt-1 truncate text-[13px] ${message.unread ? 'font-semibold text-stone-800' : 'text-stone-700'}`}>{message.subject}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-stone-500">{message.preview}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section aria-label="Message viewer" className="min-w-0 bg-white">
            <div className="border-b border-stone-200 px-4 py-4 sm:px-7 sm:py-5">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-full bg-[#F4F1EA] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--brand-teal)]">Received</span>
                <time className="text-xs text-stone-500">{active.dateLabel}</time>
              </div>
              <h2 className="truncate text-xl font-bold tracking-[-0.03em] text-stone-950 sm:text-2xl">{active.subject}</h2>
              <p className="mt-3 text-sm">
                <span className="font-semibold">{active.senderName}</span>
                <span className="ml-1 text-stone-500">&lt;{active.senderEmail}&gt;</span>
              </p>
            </div>
            <div className="bg-[var(--brand-cream-deep)] p-3 sm:p-6">
              <div role="tabpanel" aria-label="HTML preview" className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
                <iframe
                  title={`Rendered email: ${active.subject}`}
                  sandbox=""
                  referrerPolicy="no-referrer"
                  srcDoc={createSafeEmailDocument(active.html)}
                  className="h-[460px] w-full bg-white"
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
