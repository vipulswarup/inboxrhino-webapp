import type { Metadata } from 'next';
import { CodeSnippet } from '@/app/code-snippet';
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
      <div>
        <h1 className="text-3xl font-bold tracking-[-0.03em]">Playwright</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          There is no official plugin. Use <code className="font-mono text-xs">fetch</code> or Playwright&apos;s <code className="font-mono text-xs">request</code> API against a real InboxRhino inbox. That covers signup verification, OTP codes, magic links and password resets without MailHog or a USD QA platform. Wait up to 180 seconds, then delete the inbox so quota is released.
        </p>
      </div>
      <CodeSnippet code={playwrightTest} />
      <p className="text-sm leading-6 text-stone-600">
        Store <code className="font-mono text-xs">INBOXRHINO_API_KEY</code> as a CI secret. Use <code className="font-mono text-xs">received_after</code> if a previous matching email could still be in the inbox.
      </p>
      <DocsPager />
    </article>
  );
}
