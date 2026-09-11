import type { Metadata } from 'next';
import { CodeSnippet } from '@/app/code-snippet';
import { PageBreadcrumbs } from '@/app/page-breadcrumbs';
import { API_ORIGIN } from '@/app/lib/site';
import { pageMeta } from '@/app/lib/seo';
import { DocsPager } from '@/app/docs-pager';

export const metadata: Metadata = pageMeta(
  '/docs/playwright',
  'Test signup email in Playwright with InboxRhino',
  'Assert real signup, OTP and password-reset email from Playwright. No plugin: create an InboxRhino inbox, wait for the message, then delete it.',
);

const playwrightTest = `import { test, expect } from '@playwright/test';

const API = '${API_ORIGIN}';

async function responseError(response: { status(): number; text(): Promise<string> }) {
  return \`HTTP \${response.status()}: \${await response.text()}\`;
}

test('completes signup through the verification email', async ({ page, request }) => {
  const key = process.env.INBOXRHINO_API_KEY;
  test.skip(!key, 'Set INBOXRHINO_API_KEY');
  if (!key) return;
  const auth = { Authorization: \`Bearer \${key}\` };
  const startedAt = new Date().toISOString();
  const prefix = \`signup-\${Date.now().toString(36)}\`;
  let inboxId: string | undefined;

  try {
    const created = await request.post(\`\${API}/v1/inboxes\`, {
      headers: { ...auth, 'Content-Type': 'application/json' },
      data: { prefix },
    });
    expect(created.status(), await responseError(created)).toBe(201);
    const inbox = await created.json();
    inboxId = inbox.data.id;

    await page.goto(process.env.SIGNUP_URL ?? 'http://localhost:3000/signup');
    await page.getByLabel('Email').fill(inbox.data.address);
    await page.getByRole('button', { name: /sign up|create account/i }).click();

    const query = new URLSearchParams({
      wait_seconds: '180',
      limit: '1',
      include: 'content',
      subject: 'Verify',
      sender: 'noreply@example.com',
      received_after: startedAt,
    });
    const mail = await request.get(\`\${API}/v1/inboxes/\${inboxId}/messages?\${query}\`, {
      headers: auth,
      timeout: 190_000,
    });
    expect(mail.status(), mail.status() === 204
      ? 'No matching message arrived within 180 seconds'
      : await responseError(mail)).toBe(200);

    const body = await mail.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].subject).toMatch(/verify/i);
    const html = body.data[0].html ?? '';
    const verificationUrl = html.match(/href=["'](https?:\\/\\/[^"']+)["']/i)?.[1];
    expect(verificationUrl, 'Verification link missing from message HTML').toBeTruthy();
    await page.goto(verificationUrl!);
    await expect(page.getByText(/verified|account is ready/i)).toBeVisible();
  } finally {
    if (inboxId) {
      const deleted = await request.delete(\`\${API}/v1/inboxes/\${inboxId}\`, { headers: auth });
      expect(deleted.status(), await responseError(deleted)).toBe(204);
    }
  }
});`;

const githubActions = `name: Playwright email test
on: [push]
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test
        env:
          INBOXRHINO_API_KEY: \${{ secrets.INBOXRHINO_API_KEY }}
          SIGNUP_URL: https://staging.example.com/signup`;

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
          <a href="/docs/api#messages" className="font-bold text-[#0F3D3E]">
            messages API
          </a>
          .
        </p>
      </section>
      <CodeSnippet code={playwrightTest} />
      <section className="space-y-3">
        <h2 className="text-xl font-bold">Adapt the two application-specific lines</h2>
        <p className="text-sm leading-6 text-stone-600">
          Replace the signup URL, form labels, sender address and final success assertion with values from your application. Keep the InboxRhino lifecycle, the <code className="font-mono text-xs">received_after</code> boundary and cleanup unchanged. If your email contains several links, parse the one your application owns rather than selecting the first link.
        </p>
      </section>
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
      <section className="space-y-3">
        <h2 className="text-xl font-bold">GitHub Actions</h2>
        <p className="text-sm leading-6 text-stone-600">
          Add <code className="font-mono text-xs">INBOXRHINO_API_KEY</code> as a repository or environment secret. Point <code className="font-mono text-xs">SIGNUP_URL</code> at a test environment that can send real email.
        </p>
        <CodeSnippet code={githubActions} />
      </section>
      <p className="text-sm leading-6 text-stone-600">
        New to the API?{' '}
        <a href="/docs/quickstart" className="font-bold text-[#0F3D3E]">
          Read the InboxRhino API quickstart
        </a>
        . Quotas are listed on{' '}
        <a href="/pricing" className="font-bold text-[#0F3D3E]">
          InboxRhino pricing
        </a>
        .
      </p>
      <DocsPager />
    </article>
  );
}
