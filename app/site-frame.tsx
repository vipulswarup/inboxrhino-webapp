import { headers } from 'next/headers';
import { LogoWordmark } from './brand-logo';
import { JsonLd } from './json-ld';
import { siteGraphJsonLd } from './lib/seo';
import { CONTACT_EMAIL, consoleHref } from './lib/site';

const nav = [
  { href: '/docs', label: 'Docs' },
  { href: '/blog', label: 'Blog' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
];

export async function SiteHeader() {
  const loginHref = consoleHref((await headers()).get('host'), '/login');
  return (
    <header className="border-b border-[#1C1917]/10 bg-[#F7F4EF]">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
        <a href="/" aria-label="InboxRhino home">
          <LogoWordmark />
        </a>
        <nav className="flex items-center gap-2 text-sm sm:gap-4">
          {nav.map((item) => (
            <a key={item.href} href={item.href} className="hidden px-2 py-1 font-semibold text-stone-700 hover:text-[#0F3D3E] sm:inline">
              {item.label}
            </a>
          ))}
          <a href={loginHref} title="Sign in to the InboxRhino console" className="px-2 py-1 font-semibold text-stone-700 hover:text-[#0F3D3E]">
            Console sign in
          </a>
          <a href={loginHref} className="rounded-lg bg-[#0F3D3E] px-3 py-1.5 text-sm font-bold text-white">
            Create a free test inbox
          </a>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const linkClass = 'text-stone-700 hover:text-[#0F3D3E]';
  return (
    <footer className="border-t border-[#1C1917]/10 bg-[#F7F4EF]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <p className="mb-8 text-sm text-stone-600">InboxRhino. Receive-only inboxes for automated tests.</p>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#0F3D3E]">Product</p>
            <nav className="flex flex-col gap-2 text-sm font-semibold">
              <a href="/" className={linkClass}>
                InboxRhino home
              </a>
              <a href="/pricing" className={linkClass}>
                Pricing and quotas
              </a>
            </nav>
          </div>
          <div>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#0F3D3E]">Developers</p>
            <nav className="flex flex-col gap-2 text-sm font-semibold">
              <a href="/docs" className={linkClass}>
                Documentation
              </a>
              <a href="/docs/quickstart" className={linkClass}>
                API quickstart
              </a>
              <a href="/docs/api" className={linkClass}>
                API reference
              </a>
              <a href="/docs/playwright" className={linkClass}>
                Playwright email tests
              </a>
            </nav>
          </div>
          <div>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#0F3D3E]">Resources</p>
            <nav className="flex flex-col gap-2 text-sm font-semibold">
              <a href="/blog" className={linkClass}>
                InboxRhino blog
              </a>
              <a href="/compare/tigrmail" className={linkClass}>
                InboxRhino vs Tigrmail
              </a>
              <a href="/compare/mailosaur" className={linkClass}>
                InboxRhino vs Mailosaur
              </a>
              <a href="/compare/mailhog" className={linkClass}>
                InboxRhino vs MailHog
              </a>
              <a href="/india" className={linkClass}>
                INR billing and GST
              </a>
            </nav>
          </div>
          <div>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#0F3D3E]">Legal</p>
            <nav className="flex flex-col gap-2 text-sm font-semibold">
              <a href="/about" className={linkClass}>
                About
              </a>
              <a href="/legal" className={linkClass}>
                Privacy and terms
              </a>
              <a href={`mailto:${CONTACT_EMAIL}`} className={linkClass}>
                {CONTACT_EMAIL}
              </a>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}

export async function SiteFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F4F1EA] text-[#1C1917]">
      <JsonLd data={siteGraphJsonLd()} />
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}
