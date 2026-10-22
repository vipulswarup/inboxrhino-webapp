import type { Metadata } from 'next';
import { PageBreadcrumbs } from '@/app/page-breadcrumbs';
import { OPENAPI_PATH, POSTMAN_COLLECTION_PATH } from '@/app/lib/site';
import { pageMeta } from '@/app/lib/seo';
import { DocsPager } from '@/app/docs-pager';

export const metadata: Metadata = pageMeta(
  '/docs',
  'InboxRhino docs — quickstart, API reference and Playwright',
  'Documentation for InboxRhino receive-only test inboxes: create an address, wait for signup or OTP mail, inspect it, then delete it. Curl, OpenAPI, Playwright.',
);

const guides = [
  {
    href: '/docs/quickstart',
    title: 'API quickstart',
    body: 'Create a key, provision a real inbox, wait for the message, delete the inbox. About five minutes.',
  },
  {
    href: '/docs/api',
    title: 'API reference',
    body: 'Authentication, quotas, wait-for-message, errors, OpenAPI, and the Postman collection.',
  },
  {
    href: '/docs/playwright',
    title: 'Playwright email testing',
    body: 'Assert signup, OTP and password-reset mail from Playwright without a plugin.',
  },
];

const steps = [
  {
    title: 'Create an inbox',
    body: 'POST /v1/inboxes returns a fresh address on test.inboxrhino.in. Each test gets its own inbox, so parallel runs never read each other\'s mail.',
  },
  {
    title: 'Trigger the email',
    body: 'Sign up, request a password reset, or ask for an OTP in your app using that address. Your real mailer delivers it; there is nothing to rewire.',
  },
  {
    title: 'Wait for the message',
    body: 'GET /v1/inboxes/{id}/messages with wait_seconds holds the request open for up to 180 seconds and can filter by subject or sender. No sleep loops.',
  },
  {
    title: 'Assert, then delete',
    body: 'Read the parsed text or HTML, extract the code or link, and assert on it. Delete the inbox afterwards to release the active-inbox quota.',
  },
];

export default function DocsIndexPage() {
  return (
    <article className="space-y-8 pb-16">
      <PageBreadcrumbs items={[{ name: 'Documentation', path: '/docs' }]} />
      <div>
        <h1 className="text-3xl font-bold tracking-[-0.03em]">Documentation</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          InboxRhino is a receive-only test-email API. These pages are the public contract: how to create an inbox, wait for real mail, and clean up so quota is released. There is no send endpoint. Use the REST API directly; official SDK packaging is planned only after the API surface is stable.
        </p>
      </div>
      <section>
        <h2 className="text-xl font-bold text-[#1C1917]">Guides</h2>
        <ul className="mt-4 grid gap-4">
          {guides.map((guide) => (
            <li key={guide.href} className="rounded-[22px] border border-[#1C1917]/10 bg-white p-5">
              <a href={guide.href} className="text-lg font-bold text-[#0F3D3E] hover:underline">
                {guide.title}
              </a>
              <p className="mt-2 text-sm leading-6 text-stone-600">{guide.body}</p>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="text-xl font-bold text-[#1C1917]">How an InboxRhino email test works</h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-2">
          {steps.map((step, index) => (
            <li key={step.title} className="rounded-[22px] border border-[#1C1917]/10 bg-white p-5">
              <h3 className="font-bold text-[#1C1917]">
                {index + 1}. {step.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-stone-600">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>
      <section>
        <h2 className="text-xl font-bold text-[#1C1917]">Developer resources</h2>
        <p className="mt-4 text-sm leading-6 text-stone-600">
          Import the{' '}
          <a href={POSTMAN_COLLECTION_PATH} download="InboxRhino.postman_collection.json" className="font-bold text-[#0F3D3E]">
            downloadable Postman collection
          </a>
          {' or generate a client from the '}
          <a href={OPENAPI_PATH} download="inboxrhino.openapi.yaml" className="font-bold text-[#0F3D3E]">
            OpenAPI specification
          </a>
          . Quotas and GST status are on{' '}
          <a href="/pricing" className="font-bold text-[#0F3D3E]">
            InboxRhino pricing
          </a>
          . Choosing between tools? See the{' '}
          <a href="/compare/mailosaur" className="font-bold text-[#0F3D3E]">
            Mailosaur alternative
          </a>
          {' and '}
          <a href="/compare/mailhog" className="font-bold text-[#0F3D3E]">
            MailHog alternative
          </a>
          {' comparisons.'}
        </p>
      </section>
      <DocsPager />
    </article>
  );
}
