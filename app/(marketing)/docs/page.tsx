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
    title: 'Playwright email tests',
    body: 'Assert signup, OTP and password-reset mail from Playwright without a plugin.',
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
      <ul className="grid gap-4">
        {guides.map((guide) => (
          <li key={guide.href} className="rounded-[22px] border border-[#1C1917]/10 bg-white p-5">
            <a href={guide.href} className="text-lg font-bold text-[#0F3D3E] hover:underline">
              {guide.title}
            </a>
            <p className="mt-2 text-sm leading-6 text-stone-600">{guide.body}</p>
          </li>
        ))}
      </ul>
      <p className="text-sm leading-6 text-stone-600">
        Developer resources:{' '}
        <a href={POSTMAN_COLLECTION_PATH} download="InboxRhino.postman_collection.json" className="font-bold text-[#0F3D3E]">
          downloadable Postman collection
        </a>
        {' · '}
        <a href={OPENAPI_PATH} download="inboxrhino.openapi.yaml" className="font-bold text-[#0F3D3E]">
          OpenAPI specification
        </a>
        . Quotas and GST status are on{' '}
        <a href="/pricing" className="font-bold text-[#0F3D3E]">
          InboxRhino pricing
        </a>
        .
      </p>
      <DocsPager />
    </article>
  );
}
