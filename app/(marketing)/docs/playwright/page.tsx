import type { Metadata } from 'next';
import Link from 'next/link';
import { CodeSnippet } from '@/app/code-snippet';
import { PageBreadcrumbs } from '@/app/page-breadcrumbs';
import { API_ORIGIN } from '@/app/lib/site';
import { pageMeta } from '@/app/lib/seo';
import { DocsPager } from '@/app/docs-pager';

export const metadata: Metadata = pageMeta(
  '/docs/playwright',
  'Test signup email in Playwright with InboxRhino',
  'Assert real signup, OTP and password-reset email from Playwright. No plugin: create an InboxRhino inbox, wait for the message, then delete it so quota is released.',
);

const playwrightTest = `import { test, expect } from '@playwright/test';

test('reads the signup verification email', async ({ request }) => {
  const key = process.env.INBOXRHINO_API_KEY!;
  const created = await request.post('${API_ORIGIN}/v1/inboxes', {
    headers: { Authorization: \`Bearer \${key}\` },
  });
  const inbox = await created.json();

  // Trigger the app under test to send mail to inbox.data.address

  const mail = await request.get(
    \`${API_ORIGIN}/v1/inboxes/\${inbox.data.id}/messages?wait_seconds=180&limit=1&include=content&subject=Verify\`,
    { headers: { Authorization: \`Bearer \${key}\` } },
  );
  expect(mail.ok()).toBeTruthy();
  const body = await mail.json();
  expect(body.data[0].subject).toMatch(/verify/i);

  await request.delete(\`${API_ORIGIN}/v1/inboxes/\${inbox.data.id}\`, {
    headers: { Authorization: \`Bearer \${key}\` },
  });
});`;

export default function PlaywrightPage() {
  return (
    <article className="space-y-8 pb-16">
      <PageBreadcrumbs
        items={[
          { name: 'Documentation', path: '/docs' },
          { name: 'Playwright email tests', path: '/docs/playwright' },
        ]}
      />
      <div>
        <h1 className="text-3xl font-bold tracking-[-0.03em]">Playwright</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          There is no official plugin. Use <code className="font-mono text-xs">fetch</code> or Playwright&apos;s <code className="font-mono text-xs">request</code> API against a real InboxRhino inbox. That covers signup verification, OTP codes, magic links and password resets without MailHog or a USD QA platform. Wait up to 180 seconds, then delete the inbox so quota is released.
        </p>
      </div>
      <section className="space-y-3">
        <h2 className="text-xl font-bold">Signup verification example</h2>
        <p className="text-sm leading-6 text-stone-600">
          The pattern is the same for OTP and magic-link tests: allocate an address, drive the UI, wait with a subject or sender filter, parse HTML or text, then delete the inbox. Handle HTTP 200 (match) and 204 (timeout) separately — do not parse JSON on 204. Query rules are on the{' '}
          <Link href="/docs/api#messages" className="font-bold text-[#0F3D3E]">
            messages API
          </Link>
          .
        </p>
      </section>
      <CodeSnippet code={playwrightTest} />
      <section className="space-y-3">
        <h2 className="text-xl font-bold">CI notes</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-stone-600">
          <li>
            Store <code className="font-mono text-xs">INBOXRHINO_API_KEY</code> as a CI secret. Never commit it.
          </li>
          <li>
            Use <code className="font-mono text-xs">received_after</code> if a previous matching email could still be in the inbox.
          </li>
          <li>
            Delete the inbox in a <code className="font-mono text-xs">finally</code> path so a failed assertion does not leak active-inbox quota. Deleting a message does not restore monthly email quota.
          </li>
          <li>
            Local SMTP catchers such as Mailpit work on a laptop and disappear in GitHub Actions. InboxRhino is a real MX address, so the same test can run in CI.
          </li>
        </ul>
      </section>
      <p className="text-sm leading-6 text-stone-600">
        New to the API?{' '}
        <Link href="/docs/quickstart" className="font-bold text-[#0F3D3E]">
          Read the InboxRhino API quickstart
        </Link>
        . Quotas are listed on{' '}
        <Link href="/pricing" className="font-bold text-[#0F3D3E]">
          InboxRhino pricing
        </Link>
        .
      </p>
      <DocsPager />
    </article>
  );
}
