import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { CodeSnippet } from '@/app/code-snippet';
import { API_ORIGIN, consoleHref } from '@/app/lib/site';
import { pageMeta } from '@/app/lib/seo';
import { DocsPager } from '@/app/docs-pager';

export const metadata: Metadata = pageMeta(
  '/docs/quickstart',
  'InboxRhino quickstart — create an inbox and assert the email',
  'Create an InboxRhino API key, provision a real test inbox, wait for signup or reset mail, then delete the inbox. Copy-paste curl and Playwright in about five minutes.',
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
      <div>
        <h1 className="text-3xl font-bold tracking-[-0.03em]">Quickstart</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          Five minutes from signup to a passing wait-for-message request. Keep the API key in a secret manager; it is shown only once.
        </p>
      </div>
      <section className="space-y-3">
        <h2 className="text-xl font-bold">1. Create an account and API key</h2>
        <p className="text-sm leading-6 text-stone-600">
          <a href={loginHref} className="font-bold text-[#0F3D3E]">
            Sign in
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
          <Link href="/docs/api#downloads" className="font-bold text-[#0F3D3E]">
            Postman collection
          </Link>
          , is on the API reference.
        </p>
        <CodeSnippet code={deleteInbox} />
      </section>
      <DocsPager />
    </article>
  );
}
