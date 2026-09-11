import type { Metadata } from 'next';
import { CompareTable } from '@/app/compare-table';
import { PageBreadcrumbs } from '@/app/page-breadcrumbs';
import { pageMeta } from '@/app/lib/seo';

export const metadata: Metadata = pageMeta(
  '/compare/testmail',
  'InboxRhino vs testmail.app — GraphQL email testing compared',
  'Compare InboxRhino and testmail.app for automated email tests. InboxRhino offers a visual console and INR plans; testmail has GraphQL and live queries.',
);

const rows = [
  ['Receive-only email for tests', 'Yes, real MX on test.inboxrhino.in', 'Yes, namespace.tag@inbox.testmail.app'],
  ['Wait-for-message / live query', 'REST wait up to 180s', 'JSON livequery and GraphQL live queries'],
  ['Visual HTML inbox', 'Yes, sandboxed in the console', 'Visual viewer on paid plans'],
  ['API style', 'REST + OpenAPI + Postman', 'JSON REST and GraphQL'],
  ['Unlimited addresses', 'Per-inbox create/delete under quota', 'Unlimited tags inside a namespace'],
  ['SpamAssassin reports', 'Not in v1', 'Yes'],
  ['Free access', '11 inboxes / 33 emails, 30-day retention', '100 emails / month, 1-day retention'],
  ['Paid starting price', 'INR plans listed; checkout not open', 'Essential / Pro USD plans'],
  ['INR / GST invoices', 'Designed, checkout coming', 'USD billing'],
  ['Message delete for quota', 'Delete inbox to free active slots', 'Retention cron; no delete-in-API for quota'],
];

export default function CompareTestmailPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <PageBreadcrumbs items={[{ name: 'InboxRhino vs testmail.app', path: '/compare/testmail' }]} />
      <h1 className="text-4xl font-bold tracking-[-0.04em]">InboxRhino vs testmail.app</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-stone-600">
        Both are receive-only email testing APIs for developers and QA. testmail.app sells unlimited tag-based addresses, GraphQL, live queries, and SpamAssassin scores. InboxRhino sells a sandboxed HTML console, named API keys, OpenAPI/Postman, and INR billing designed for Indian teams. Choose InboxRhino when you want visual debugging and GST-ready pricing. Choose testmail.app when GraphQL filters, spam scores, or tag namespaces matter more. Confirm current testmail behaviour on{' '}
        <a href="https://testmail.app" className="font-bold text-[#0F3D3E]" rel="noopener noreferrer">
          testmail.app
        </a>
        .
      </p>

      <section className="mt-10 space-y-4 text-sm leading-6 text-stone-700">
        <h2 className="text-xl font-bold text-[#1C1917]">Who each product fits</h2>
        <p>
          InboxRhino fits Playwright and Cypress suites that need a real MX inbox, a browser viewer for QA, and a free tier large enough to wire one flow. Paid Starter/Growth/Scale prices are listed in INR; checkout is not open yet.
        </p>
        <p>
          testmail.app fits teams that want a namespace.tag address scheme, GraphQL search, and live queries. The free plan is 100 emails per month with one-day retention after a trial. Higher plans unlock longer retention and custom namespaces.
        </p>
      </section>

      <CompareTable columns={['Capability', 'InboxRhino', 'testmail.app']} rows={rows} />

      <p className="mt-6 text-xs leading-5 text-stone-500">
        Compared on 11 September 2026 from InboxRhino&apos;s live product and testmail.app&apos;s public site and pricing page. Competitor cells can change; re-check before you buy. InboxRhino paid checkout is not live.
      </p>
      <p className="mt-8 text-sm text-stone-600">
        See{' '}
        <a href="/compare/mailosaur" className="font-bold text-[#0F3D3E]">
          Mailosaur alternative
        </a>
        ,{' '}
        <a href="/compare/mailslurp" className="font-bold text-[#0F3D3E]">
          InboxRhino vs MailSlurp
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
