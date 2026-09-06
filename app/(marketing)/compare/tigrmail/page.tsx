import type { Metadata } from 'next';
import Link from 'next/link';
import { PageBreadcrumbs } from '@/app/page-breadcrumbs';
import { pageMeta } from '@/app/lib/seo';

export const metadata: Metadata = pageMeta(
  '/compare/tigrmail',
  'InboxRhino vs Tigrmail — visual inbox and named API keys',
  'Compare InboxRhino and Tigrmail for receive-only email testing. InboxRhino adds a sandboxed HTML inbox, multiple API keys, and INR billing designed for Indian teams.',
);

const rows = [
  ['Receive-only test inboxes', 'Yes', 'Yes'],
  ['Wait-for-message API', 'Yes, up to 180s', 'Yes'],
  ['Visual HTML inbox', 'Yes, sandboxed', 'Limited public UI'],
  ['Multiple named API keys', 'Yes, rotate by revoke', 'Single-key workflow'],
  ['Easy inbox delete / quota release', 'Yes', 'Less direct'],
  ['Free tier', '11 inboxes / 33 emails', '10 inboxes / 30 emails'],
  ['INR / GST billing', 'Designed, checkout coming', 'Not offered'],
  ['SDKs / OTP extraction helpers', 'Not in v1', 'Limited'],
];

export default function CompareTigrmailPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <PageBreadcrumbs items={[{ name: 'InboxRhino vs Tigrmail', path: '/compare/tigrmail' }]} />
      <h1 className="text-4xl font-bold tracking-[-0.04em]">InboxRhino vs Tigrmail</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-stone-600">
        Both are receive-only APIs for automated tests. Choose InboxRhino when you want a sandboxed HTML mailbox, named API keys, and INR/GST billing designed for Indian teams. Choose Tigrmail when you already have that workflow and do not need those extras. Confirm current Tigrmail behaviour on{' '}
        <a href="https://tigrmail.com" className="font-bold text-[#0F3D3E]" rel="noopener noreferrer">
          tigrmail.com
        </a>
        .
      </p>

      <section className="mt-10 space-y-4 text-sm leading-6 text-stone-700">
        <h2 className="text-xl font-bold text-[#1C1917]">Who each product fits</h2>
        <p>
          InboxRhino is for Playwright/Cypress suites, agentic QA, and Indian SaaS teams that need a real MX address, visual debugging, and later GST invoices. It does not send mail, extract OTPs for you, or offer an SDK in v1.
        </p>
        <p>
          Tigrmail is also a temporary receive-inbox API aimed at end-to-end email verification. If visual QA, key rotation, or INR invoicing are not requirements, it may already cover the wait-and-assert loop.
        </p>
      </section>

      <div className="mt-10 overflow-x-auto rounded-[22px] border border-[#1C1917]/10 bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-[#1C1917]/10 bg-[#F7F4EF] text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3 font-bold">Capability</th>
              <th className="px-4 py-3 font-bold">InboxRhino</th>
              <th className="px-4 py-3 font-bold">Tigrmail</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row[0]} className="border-b border-[#1C1917]/10 last:border-0">
                <td className="px-4 py-3 text-stone-700">{row[0]}</td>
                <td className="px-4 py-3 text-stone-700">{row[1]}</td>
                <td className="px-4 py-3 text-stone-700">{row[2]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-xs leading-5 text-stone-500">
        Compared on 6 September 2026 from InboxRhino&apos;s live product and Tigrmail&apos;s public site. Competitor cells can change; re-check before you buy. InboxRhino paid checkout is not live.
      </p>
      <p className="mt-8 text-sm text-stone-600">
        See{' '}
        <Link href="/pricing" className="font-bold text-[#0F3D3E]">
          InboxRhino pricing and quotas
        </Link>
        , the{' '}
        <Link href="/docs/quickstart" className="font-bold text-[#0F3D3E]">
          API quickstart
        </Link>
        , and{' '}
        <Link href="/india" className="font-bold text-[#0F3D3E]">
          INR billing and GST invoices
        </Link>
        .
      </p>
    </main>
  );
}
