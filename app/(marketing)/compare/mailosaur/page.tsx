import type { Metadata } from 'next';
import { CompareTable } from '@/app/compare-table';
import { PageBreadcrumbs } from '@/app/page-breadcrumbs';
import { pageMeta } from '@/app/lib/seo';

export const metadata: Metadata = pageMeta(
  '/compare/mailosaur',
  'InboxRhino vs Mailosaur — a Mailosaur alternative for email-only tests',
  'Compare InboxRhino and Mailosaur for email-only tests. InboxRhino has a free tier and visual inbox. Mailosaur adds SMS, SDKs, and USD plans from $20 a month.',
);

const rows = [
  ['Receive-only email for tests', 'Yes, real MX on test.inboxrhino.in', 'Yes, Mailosaur servers and inboxes'],
  ['Wait-for-message API', 'Yes, up to 180s', 'Yes'],
  ['Visual HTML inbox', 'Yes, sandboxed in the console', 'Dashboard; device/client previews are a paid add-on'],
  ['SMS / MFA phone numbers', 'No', 'Yes, SMS add-on from $37.50 / month'],
  ['Official SDKs', 'Not in v1; call REST from tests', 'Yes: JavaScript, Python, .NET, Java, Ruby'],
  ['OTP / link extraction helpers', 'Not in v1; parse text or HTML yourself', 'Yes'],
  ['Free access', 'Live free tier: 11 inboxes / 33 emails', '14-day trial; no ongoing free plan'],
  ['Paid starting price', 'INR plans listed; checkout not open', 'From $20 / month billed annually (Personal)'],
  ['INR / GST invoices', 'Designed, checkout coming', 'USD billing; VAT or sales tax per Mailosaur'],
  ['Send / reply from the test address', 'No; receive-only', 'Core plan can reply/send to external addresses'],
];

export default function CompareMailosaurPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <PageBreadcrumbs items={[{ name: 'InboxRhino vs Mailosaur', path: '/compare/mailosaur' }]} />
      <h1 className="text-4xl font-bold tracking-[-0.04em]">InboxRhino vs Mailosaur</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-stone-600">
        Mailosaur is a paid QA platform for email and SMS. InboxRhino is a receive-only test-email API with a sandboxed HTML mailbox. Choose InboxRhino when you only need signup, OTP, magic-link, or password-reset mail in Playwright or Cypress. Choose Mailosaur when you need SMS, official SDKs, client previews, or a USD QA platform with a trial rather than a free tier. Confirm current Mailosaur behaviour on{' '}
        <a href="https://mailosaur.com" className="font-bold text-[#0F3D3E]" rel="noopener noreferrer">
          mailosaur.com
        </a>
        .
      </p>

      <section className="mt-10 space-y-4 text-sm leading-6 text-stone-700">
        <h2 className="text-xl font-bold text-[#1C1917]">Who each product fits</h2>
        <p>
          InboxRhino is for teams that already send real mail from staging and need a public MX address the suite can wait on. The free tier is enough to wire one flow on a laptop. Indian GST invoicing is designed and marked coming soon; it is not live. InboxRhino does not send SMS, preview messages across Outlook/Gmail devices, or ship an SDK in v1.
        </p>
        <p>
          Mailosaur is for QA organisations that want email plus SMS, MFA numbers, language SDKs, and optional email-client previews. Personal starts at $20 per month billed annually for one inbox and 15,000 emails. Core starts at $50 per month billed annually. SMS and email previews are separate add-ons on the public pricing page.
        </p>
      </section>

      <CompareTable columns={['Capability', 'InboxRhino', 'Mailosaur']} rows={rows} />

      <p className="mt-6 text-xs leading-5 text-stone-500">
        Compared on 7 September 2026 from InboxRhino&apos;s live product and Mailosaur&apos;s public site and pricing page. Competitor cells can change; re-check before you buy. InboxRhino paid checkout is not live.
      </p>
      <p className="mt-8 text-sm text-stone-600">
        See{' '}
        <a href="/pricing" className="font-bold text-[#0F3D3E]">
          InboxRhino pricing and quotas
        </a>
        , the{' '}
        <a href="/docs/playwright" className="font-bold text-[#0F3D3E]">
          Playwright email tests
        </a>
        ,{' '}
        <a href="/compare/tigrmail" className="font-bold text-[#0F3D3E]">
          InboxRhino vs Tigrmail
        </a>
        ,{' '}
        <a href="/compare/mailhog" className="font-bold text-[#0F3D3E]">
          InboxRhino vs MailHog and Mailpit
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
