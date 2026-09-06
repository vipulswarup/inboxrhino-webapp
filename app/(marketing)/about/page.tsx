import type { Metadata } from 'next';
import Link from 'next/link';
import { PageBreadcrumbs } from '@/app/page-breadcrumbs';
import { CONTACT_EMAIL } from '@/app/lib/site';
import { pageMeta } from '@/app/lib/seo';

export const metadata: Metadata = pageMeta(
  '/about',
  'About InboxRhino — from the makers of EisenVault',
  'InboxRhino is a receive-only test email API from Argali Knowledge Services Pvt Ltd, the creators of EisenVault. Head office in New Delhi.',
);

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-12 px-4 py-16 sm:px-6">
      <PageBreadcrumbs items={[{ name: 'About', path: '/about' }]} />
      <header>
        <h1 className="text-4xl font-bold tracking-[-0.04em]">About InboxRhino</h1>
        <p className="mt-4 text-sm leading-6 text-stone-600">
          InboxRhino is a receive-only test email API. Create a real inbox, wait for the message, inspect it in the browser, then delete it. It is built for developers and QA teams who need signup verification, password resets, magic links, and OTPs in automated tests.
        </p>
      </header>

      <section className="space-y-4 text-sm leading-6 text-stone-700">
        <h2 className="text-2xl font-bold text-[#1C1917]">Who makes it</h2>
        <p>
          InboxRhino is brought to you by{' '}
          <a href="https://argali.in" className="font-bold text-[#0F3D3E]">
            Argali Knowledge Services Pvt Ltd
          </a>
          , the same team behind{' '}
          <a href="https://www.eisenvault.com" className="font-bold text-[#0F3D3E]">
            EisenVault
          </a>
          , an enterprise document management system used by organisations in India and internationally.
        </p>
        <p>
          Argali has been building software since 2015: document management, full-stack web applications, and developer tools. See{' '}
          <a href="https://argali.in" className="font-bold text-[#0F3D3E]">
            argali.in
          </a>{' '}
          for the company, and{' '}
          <a href="https://www.eisenvault.com" className="font-bold text-[#0F3D3E]">
            eisenvault.com
          </a>{' '}
          for the document management product. InboxRhino applies that operational experience to a narrower problem: reliable inbound email for tests, with real MX, a sandboxed viewer, and INR/GST billing for Indian teams.
        </p>
      </section>

      <section className="space-y-4 text-sm leading-6 text-stone-700">
        <h2 className="text-2xl font-bold text-[#1C1917]">Company</h2>
        <p>Argali Knowledge Services Private Limited</p>
        <p>
          <a href="https://argali.in" className="font-bold text-[#0F3D3E]">
            argali.in
          </a>
          {' · '}
          <a href="https://www.eisenvault.com" className="font-bold text-[#0F3D3E]">
            eisenvault.com
          </a>
        </p>
        <p>
          Contact InboxRhino at{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-bold text-[#0F3D3E]">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </section>

      <section className="space-y-4 text-sm leading-6 text-stone-700">
        <h2 className="text-2xl font-bold text-[#1C1917]">Head office</h2>
        <p>
          4th Floor, Statesman House
          <br />
          Barakhamba Road
          <br />
          New Delhi 110001, India
        </p>
        <p>
          Phone:{' '}
          <a href="tel:+917428242192" className="font-bold text-[#0F3D3E]">
            +91 74282 42192
          </a>
        </p>
      </section>

      <p className="text-sm leading-6 text-stone-600">
        For privacy and terms, see the{' '}
        <Link href="/legal" className="font-bold text-[#0F3D3E]">
          privacy policy and terms of service
        </Link>
        . Product limits are on{' '}
        <Link href="/pricing" className="font-bold text-[#0F3D3E]">
          InboxRhino pricing
        </Link>
        . Start with the{' '}
        <Link href="/docs/quickstart" className="font-bold text-[#0F3D3E]">
          API quickstart
        </Link>
        .
      </p>
    </main>
  );
}
