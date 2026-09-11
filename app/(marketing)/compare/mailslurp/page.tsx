import type { Metadata } from 'next';
import { CompareTable } from '@/app/compare-table';
import { PageBreadcrumbs } from '@/app/page-breadcrumbs';
import { pageMeta } from '@/app/lib/seo';

export const metadata: Metadata = pageMeta(
  '/compare/mailslurp',
  'InboxRhino vs MailSlurp — a MailSlurp alternative for email-only tests',
  'Compare InboxRhino and MailSlurp. InboxRhino is a free-tier receive-only MX inbox. MailSlurp adds SDKs, SMS and a larger free sandbox.',
);

const rows = [
  ['Receive-only email for tests', 'Yes, real MX on test.inboxrhino.in', 'Yes, disposable inboxes on MailSlurp'],
  ['Wait-for-message API', 'Yes, up to 180s', 'Yes, waitFor helpers in SDKs and API'],
  ['Visual HTML inbox', 'Yes, sandboxed in the console', 'Dashboard with renders and placement tools on paid tiers'],
  ['Official SDKs', 'Not in v1; call REST from tests', 'Yes: JavaScript, Java, Python, PHP, Ruby, C#, Go and more'],
  ['SMS / MFA phone numbers', 'No', 'Yes on paid phone plans'],
  ['Free access', 'Live free tier: 11 inboxes / 33 emails', 'Free forever sandbox: up to 50 inboxes / 500 emails'],
  ['Paid starting price', 'INR plans listed; checkout not open', 'Pro from about $50 / month (USD)'],
  ['INR / GST invoices', 'Designed, checkout coming', 'USD billing'],
  ['OTP / link extraction helpers', 'Not in v1; parse text or HTML yourself', 'Yes in SDKs and API'],
];

export default function CompareMailslurpPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <PageBreadcrumbs items={[{ name: 'MailSlurp alternative', path: '/compare/mailslurp' }]} />
      <h1 className="text-4xl font-bold tracking-[-0.04em]">MailSlurp alternative: InboxRhino vs MailSlurp</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-stone-600">
        Looking for a MailSlurp alternative for email-only Playwright or Cypress tests? MailSlurp is a broad email-and-SMS QA platform with many language SDKs. InboxRhino is a narrower receive-only MX inbox with a sandboxed HTML viewer and INR billing designed for Indian teams. Choose InboxRhino when you only need signup, OTP, magic-link, or password-reset mail and want a free tier plus a visual console. Choose MailSlurp when you need SDKs, SMS numbers, placement tests, or a larger free sandbox. Confirm current MailSlurp behaviour on{' '}
        <a href="https://www.mailslurp.com" className="font-bold text-[#0F3D3E]" rel="noopener noreferrer">
          mailslurp.com
        </a>
        .
      </p>

      <section className="mt-10 space-y-4 text-sm leading-6 text-stone-700">
        <h2 className="text-xl font-bold text-[#1C1917]">Who each product fits</h2>
        <p>
          InboxRhino is for teams that already send real mail from staging and need a public address the suite can wait on. Call REST from Playwright, open the HTML in the console, then delete the inbox. Paid INR checkout is listed and not open yet.
        </p>
        <p>
          MailSlurp is for teams that want official SDKs, OTP helpers, optional SMS, and a larger free development sandbox (about 50 retained inboxes and 500 inbound emails per month on the public free plan). Phone numbers and SMS are paid add-ons. Pro pricing starts around $50 per month in USD.
        </p>
      </section>

      <CompareTable columns={['Capability', 'InboxRhino', 'MailSlurp']} rows={rows} />

      <p className="mt-6 text-xs leading-5 text-stone-500">
        Compared on 11 September 2026 from InboxRhino&apos;s live product and MailSlurp&apos;s public site and pricing page. Competitor cells can change; re-check before you buy. InboxRhino paid checkout is not live.
      </p>
      <p className="mt-8 text-sm text-stone-600">
        See{' '}
        <a href="/compare/mailosaur" className="font-bold text-[#0F3D3E]">
          Mailosaur alternative
        </a>
        ,{' '}
        <a href="/compare/testmail" className="font-bold text-[#0F3D3E]">
          InboxRhino vs testmail.app
        </a>
        ,{' '}
        <a href="/docs/playwright" className="font-bold text-[#0F3D3E]">
          Playwright email testing
        </a>
        , and{' '}
        <a href="/pricing" className="font-bold text-[#0F3D3E]">
          InboxRhino pricing
        </a>
        .
      </p>
    </main>
  );
}
