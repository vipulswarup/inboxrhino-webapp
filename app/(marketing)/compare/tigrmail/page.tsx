import type { Metadata } from 'next';
import { CompareFaq, CompareTable } from '@/app/compare-table';
import { PageBreadcrumbs } from '@/app/page-breadcrumbs';
import { pageMeta } from '@/app/lib/seo';

export const metadata: Metadata = pageMeta(
  '/compare/tigrmail',
  'InboxRhino vs Tigrmail — visual inbox and named API keys',
  'Compare InboxRhino and Tigrmail for receive-only email testing. InboxRhino adds a sandboxed HTML inbox, multiple API keys and INR billing for Indian teams.',
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

const faqs = [
  {
    q: 'How do the InboxRhino and Tigrmail free tiers compare?',
    a: 'InboxRhino\'s free tier is 11 active inboxes and 33 inbound emails per month. Tigrmail\'s free tier is 10 inboxes and 30 emails.',
  },
  {
    q: 'What does InboxRhino add over Tigrmail?',
    a: 'A sandboxed HTML inbox for visual QA, multiple named API keys that you rotate by revoking, direct inbox delete to release quota, and INR/GST billing designed for Indian teams (checkout is coming).',
  },
  {
    q: 'Does either product extract OTP codes for me?',
    a: 'InboxRhino does not in v1; parse the code from the message text or HTML in your test. Tigrmail\'s extraction helpers are limited.',
  },
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
        <h2 className="text-xl font-bold text-[#1C1917]">When to choose InboxRhino</h2>
        <p>
          InboxRhino is for Playwright/Cypress suites, agentic QA, and Indian SaaS teams that need a real MX address, visual debugging, and later GST invoices. It does not send mail, extract OTPs for you, or offer an SDK in v1.
        </p>
        <h2 className="pt-4 text-xl font-bold text-[#1C1917]">When to choose Tigrmail</h2>
        <p>
          Tigrmail is also a temporary receive-inbox API aimed at end-to-end email verification. If visual QA, key rotation, or INR invoicing are not requirements, it may already cover the wait-and-assert loop.
        </p>
      </section>

      <CompareTable heading="Features and pricing: InboxRhino vs Tigrmail" columns={['Capability', 'InboxRhino', 'Tigrmail']} rows={rows} />

      <p className="mt-6 text-xs leading-5 text-stone-500">
        Compared on 6 September 2026 from InboxRhino&apos;s live product and Tigrmail&apos;s public site. Competitor cells can change; re-check before you buy. InboxRhino paid checkout is not live.
      </p>
      <CompareFaq faqs={faqs} />
      <p className="mt-8 text-sm text-stone-600">
        See{' '}
        <a href="/pricing" className="font-bold text-[#0F3D3E]">
          InboxRhino pricing and quotas
        </a>
        , the{' '}
        <a href="/docs/quickstart" className="font-bold text-[#0F3D3E]">
          API quickstart
        </a>
        ,{' '}
        <a href="/compare/mailosaur" className="font-bold text-[#0F3D3E]">
          Mailosaur alternative
        </a>
        ,{' '}
        <a href="/compare/mailhog" className="font-bold text-[#0F3D3E]">
          MailHog alternative
        </a>
        ,{' '}
        <a href="/compare/mailslurp" className="font-bold text-[#0F3D3E]">
          InboxRhino vs MailSlurp
        </a>
        ,{' '}
        <a href="/compare/testmail" className="font-bold text-[#0F3D3E]">
          InboxRhino vs testmail.app
        </a>
        , and{' '}
        <a href="/india" className="font-bold text-[#0F3D3E]">
          INR billing and GST invoices
        </a>
        .
      </p>
    </main>
  );
}
