import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { CodeSnippet } from '@/app/code-snippet';
import { PageBreadcrumbs } from '@/app/page-breadcrumbs';
import { API_ORIGIN, consoleHref } from '@/app/lib/site';
import { pageMeta } from '@/app/lib/seo';
import { DocsPager } from '@/app/docs-pager';

export const metadata: Metadata = pageMeta(
  '/docs/quickstart',
  'InboxRhino quickstart — create an inbox and assert the email',
  'Create an InboxRhino API key, provision a real test inbox, wait for signup or reset mail, then delete it. Copy-paste curl and Playwright in five minutes.',
);

const createInbox = `curl --request POST ${API_ORIGIN}/v1/inboxes \\
  --header "Authorization: Bearer $INBOXRHINO_API_KEY" \\
  --header "Content-Type: application/json" \\
  --header "Idempotency-Key: signup-test-1" \\
  --data '{"prefix":"signup-test"}'`;

const waitForMail = `curl --get ${API_ORIGIN}/v1/inboxes/INBOX_ID/messages \\
  --header "Authorization: Bearer $INBOXRHINO_API_KEY" \\
  --data-urlencode "wait_seconds=180" \\
  --data-urlencode "limit=1" \\
  --data-urlencode "include=content" \\
  --data-urlencode "subject=Verify"`;

const deleteInbox = `curl --request DELETE ${API_ORIGIN}/v1/inboxes/INBOX_ID \\
  --header "Authorization: Bearer $INBOXRHINO_API_KEY"`;

export default async function QuickstartPage() {
  const loginHref = consoleHref((await headers()).get('host'), '/login');
  return (
    <article className="space-y-8 pb-16">
      <PageBreadcrumbs
        items={[
          { name: 'Documentation', path: '/docs' },
          { name: 'API quickstart', path: '/docs/quickstart' },
        ]}
      />
      <div>
        <h1 className="text-3xl font-bold tracking-[-0.03em]">Quickstart</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          Five minutes from signup to a passing wait-for-message request. Keep the API key in a secret manager; it is shown only once. The free tier is 11 active inboxes and 33 inbound emails per UTC month — enough for one flow on a laptop. Quota detail is on{' '}
          <a href="/pricing" className="font-bold text-[#0F3D3E]">
            InboxRhino pricing
          </a>
          .
        </p>
      </div>
      <section className="space-y-3">
        <h2 className="text-xl font-bold">1. Create an account and API key</h2>
        <p className="text-sm leading-6 text-stone-600">
          <a href={loginHref} className="font-bold text-[#0F3D3E]">
            Sign in to the InboxRhino console
          </a>{' '}
          with Google or email, open API keys, and create a named key. Copy the secret immediately.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-bold">2. Create an inbox</h2>
        <p className="text-sm leading-6 text-stone-600">
          POST creates a real address on test.inboxrhino.in and the Cloudflare receiving rule. Omit prefix to get a generated name.
        </p>
        <CodeSnippet code={createInbox} />
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-bold">3. Send mail, then wait</h2>
        <p className="text-sm leading-6 text-stone-600">
          Point the application under test at the returned address. The list route waits up to 180 seconds. A match returns 200; a timeout returns 204.
        </p>
        <CodeSnippet code={waitForMail} />
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-bold">4. Delete the inbox</h2>
        <p className="text-sm leading-6 text-stone-600">
          Deleting an inbox frees active-inbox quota immediately. Message deletion does not restore monthly email quota. Full request and error detail, plus a free{' '}
          <a href="/docs/api#downloads" className="font-bold text-[#0F3D3E]">
            Postman collection
          </a>
          , is on the{' '}
          <a href="/docs/api" className="font-bold text-[#0F3D3E]">
            API reference
          </a>
          . For a test runner example, see{' '}
          <a href="/docs/playwright" className="font-bold text-[#0F3D3E]">
            Playwright email testing
          </a>
          .
        </p>
        <CodeSnippet code={deleteInbox} />
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-bold">If the wait returns 204</h2>
        <p className="text-sm leading-6 text-stone-600">
          HTTP 204 means the poll timed out with no match. Check the address you sent to, loosen or correct the subject/sender filter, and confirm the application actually sent mail. Do not call <code className="font-mono text-xs">response.json()</code> on 204. Status codes and filters are documented in the{' '}
          <a href="/docs/api#messages" className="font-bold text-[#0F3D3E]">
            messages API
          </a>
          .
        </p>
      </section>
      <DocsPager />
    </article>
  );
}
