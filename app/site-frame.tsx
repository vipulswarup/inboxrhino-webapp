import Link from 'next/link';
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
        <Link href="/" aria-label="InboxRhino home">
          <LogoWordmark />
        </Link>
        <nav className="flex items-center gap-2 text-sm sm:gap-4">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="hidden px-2 py-1 font-semibold text-stone-700 hover:text-[#0F3D3E] sm:inline">
              {item.label}
            </Link>
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
              <Link href="/" className={linkClass}>
                InboxRhino home
              </Link>
              <Link href="/pricing" className={linkClass}>
                Pricing and quotas
              </Link>
            </nav>
          </div>
          <div>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#0F3D3E]">Developers</p>
            <nav className="flex flex-col gap-2 text-sm font-semibold">
              <Link href="/docs" className={linkClass}>
                Documentation
              </Link>
              <Link href="/docs/quickstart" className={linkClass}>
                API quickstart
              </Link>
              <Link href="/docs/api" className={linkClass}>
                API reference
              </Link>
              <Link href="/docs/playwright" className={linkClass}>
                Playwright email tests
              </Link>
            </nav>
          </div>
          <div>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#0F3D3E]">Resources</p>
            <nav className="flex flex-col gap-2 text-sm font-semibold">
              <Link href="/blog" className={linkClass}>
                InboxRhino blog
              </Link>
              <Link href="/compare/tigrmail" className={linkClass}>
                InboxRhino vs Tigrmail
              </Link>
              <Link href="/compare/mailosaur" className={linkClass}>
                InboxRhino vs Mailosaur
              </Link>
              <Link href="/compare/mailhog" className={linkClass}>
                InboxRhino vs MailHog
              </Link>
              <Link href="/india" className={linkClass}>
                INR billing and GST
              </Link>
            </nav>
          </div>
          <div>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#0F3D3E]">Legal</p>
            <nav className="flex flex-col gap-2 text-sm font-semibold">
              <Link href="/about" className={linkClass}>
                About
              </Link>
              <Link href="/legal" className={linkClass}>
                Privacy and terms
              </Link>
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
