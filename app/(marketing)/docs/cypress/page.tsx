import type { Metadata } from 'next';
import { CodeSnippet } from '@/app/code-snippet';
import { PageBreadcrumbs } from '@/app/page-breadcrumbs';
import { API_ORIGIN } from '@/app/lib/site';
import { faqPageJsonLd, pageMeta } from '@/app/lib/seo';
import { DocsPager } from '@/app/docs-pager';

const articleUrl = '/news/testing-email-otp-flows-in-cypress-using-temporary-api-inboxes';
const title = 'Cypress email testing — signup, OTP and magic links';
const description = 'Cypress email testing with InboxRhino: create a real inbox via cy.request, wait up to 180 seconds for OTP or magic-link mail, then delete the inbox.';

export const metadata: Metadata = pageMeta('/docs/cypress', title, description);

const faqs = [
  { q: 'Do I need a Cypress plugin to test email with InboxRhino?', a: 'No. cy.request against the InboxRhino REST API is enough.' },
  { q: 'How long will InboxRhino wait for the email?', a: 'Up to 180 seconds in one request. A match returns HTTP 200; a timeout returns HTTP 204 with an empty body. Do not parse JSON on 204.' },
  { q: 'How do I stop Cypress from timing out before the wait ends?', a: 'Set the cy.request timeout higher than 180 seconds.' },
  { q: 'What happens if I forget to delete the inbox?', a: 'It counts toward the active-inbox cap until you delete it.' },
  { q: 'Can I use this in GitHub Actions?', a: 'Yes, with a real mail-sending staging environment and the API key stored as a secret.' },
  { q: 'Where is the Playwright version of this guide?', a: 'See the Playwright email testing guide at /docs/playwright.' },
];

const cypressTest = `const API = '${API_ORIGIN}';
let inboxId: string | undefined;

describe('signup email verification', () => {
  beforeEach(function () {
    if (!Cypress.env('INBOXRHINO_API_KEY')) this.skip();
  });

  afterEach(() => {
    if (inboxId) {
      const id = inboxId;
      inboxId = undefined;
      cy.request({
        method: 'DELETE',
        url: \`\${API}/v1/inboxes/\${id}\`,
        headers: { Authorization: \`Bearer \${Cypress.env('INBOXRHINO_API_KEY')}\` },
        failOnStatusCode: false,
      }).its('status').should('eq', 204);
    }
  });

  it('completes signup through the verification email', () => {
    const key = Cypress.env('INBOXRHINO_API_KEY') as string;
    const startedAt = new Date().toISOString();
    const prefix = \`signup-\${Date.now().toString(36)}\`;

    cy.request({
      method: 'POST',
      url: \`\${API}/v1/inboxes\`,
      headers: { Authorization: \`Bearer \${key}\` },
      body: { prefix },
    }).then((created) => {
      expect(created.status).to.eq(201);
      inboxId = created.body.data.id as string;
      const address = created.body.data.address as string;

      cy.visit(Cypress.env('SIGNUP_URL') || 'http://localhost:3000/signup');
      cy.get('[data-cy=email]').type(address);
      cy.get('[data-cy=signup-submit]').click();

      return cy.request({
        method: 'GET',
        url: \`\${API}/v1/inboxes/\${inboxId}/messages\`,
        qs: {
          wait_seconds: 180,
          limit: 1,
          include: 'content',
          subject: 'Verify',
          sender: 'noreply@example.com',
          received_after: startedAt,
        },
        headers: { Authorization: \`Bearer \${key}\` },
        timeout: 190_000,
        failOnStatusCode: false,
      });
    }).then((mail) => {
      if (mail.status === 204) throw new Error('No matching email arrived within 180 seconds');
      expect(mail.status).to.eq(200);
      expect(mail.body.data).to.have.length(1);
      const message = mail.body.data[0];
      const content = \`\${message.text ?? ''}\\n\${message.html ?? ''}\`;
      const verificationUrl = content.match(/https?:\\/\\/[^\\s"'<>]+/i)?.[0];
      expect(verificationUrl, 'Verification link missing from email').to.exist;
      cy.visit(verificationUrl!);
      cy.contains(/verified|account is ready/i).should('be.visible');
    });
  });
});`;

const githubActions = `name: Cypress email test
on: [push]
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npx cypress run
        env:
          INBOXRHINO_API_KEY: \${{ secrets.INBOXRHINO_API_KEY }}
          SIGNUP_URL: https://staging.example.com/signup`;

export default function CypressPage() {
  return (
    <article className="space-y-8 pb-16">
      <PageBreadcrumbs items={[{ name: 'Documentation', path: '/docs' }, { name: 'Cypress email testing', path: '/docs/cypress' }]} />
      <div>
        <h1 className="text-3xl font-bold tracking-[-0.03em]">Cypress email testing</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">No Cypress plugin is required: use cy.request against a real InboxRhino inbox to test signup verification, OTP codes, magic links and password resets. Wait up to 180 seconds for mail, handle HTTP 200 matches and HTTP 204 timeouts separately, then delete the inbox to release its active-inbox quota.</p>
      </div>
      <section className="space-y-3"><h2 className="text-xl font-bold">Signup / OTP example</h2><p className="text-sm leading-6 text-stone-600">Create an inbox, run your signup flow, wait for matching mail, inspect its content and clean up in <code>afterEach</code>, which Cypress runs after a failing test too. A 204 response has no JSON body.</p></section>
      <CodeSnippet code={cypressTest} />
      <section className="space-y-3"><h2 className="text-xl font-bold">Adapt the application-specific lines</h2><p className="text-sm leading-6 text-stone-600">Replace the signup URL, form selectors, sender or subject filter and success assertion. Keep the InboxRhino lifecycle, <code>received_after</code> boundary and cleanup unchanged. If the email has several links, parse the link owned by your application rather than assuming the first href is correct.</p></section>
      <section className="space-y-3"><h2 className="text-xl font-bold">Extracting an OTP vs a magic link</h2><p className="text-sm leading-6 text-stone-600">InboxRhino returns parsed message content; your test must parse the OTP from text or HTML. OTP extraction is not built into v1. For a magic link, select the application-owned URL from the message.</p></section>
      <section className="space-y-3"><h2 className="text-xl font-bold">CI notes</h2><ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-stone-600"><li>Store <code>INBOXRHINO_API_KEY</code> as a CI secret or Cypress environment variable. Never commit it.</li><li>Use <code>received_after</code> if an earlier matching message could still be in the inbox.</li><li>Delete the inbox in cleanup so failed assertions do not use an active-inbox slot. Deleting a message does not restore monthly email quota.</li></ul></section>
      <section className="space-y-3"><h2 className="text-xl font-bold">GitHub Actions</h2><p className="text-sm leading-6 text-stone-600">Use a staging URL whose application can send real email. Keep the API key in repository or environment secrets.</p><CodeSnippet code={githubActions} /></section>
      <section className="space-y-3"><h2 className="text-xl font-bold">Limits that affect Cypress suites</h2><p className="text-sm leading-6 text-stone-600">InboxRhino is receive-only, and messages are retained for 30 days. The live free plan allows 11 active inboxes and 33 inbound emails per UTC month. Paid checkout is not open; see <a className="font-bold text-[#0F3D3E]" href="/pricing">pricing and quotas</a> for current status.</p></section>
      <section className="space-y-3"><h2 className="text-xl font-bold">FAQ</h2>{faqs.map(({ q, a }) => <div key={q}><h3 className="font-bold">{q}</h3><p className="text-sm leading-6 text-stone-600">{a}</p></div>)}<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageJsonLd(faqs)).replace(/</g, '\\u003c') }} /></section>
      <p className="text-sm leading-6 text-stone-600">Start with the <a href="/docs/quickstart" className="font-bold text-[#0F3D3E]">API quickstart</a> and <a href="/docs/api" className="font-bold text-[#0F3D3E]">API reference</a>. Also see <a href="/docs/playwright" className="font-bold text-[#0F3D3E]">Playwright email testing</a> or the longer news article, <a href={articleUrl} className="font-bold text-[#0F3D3E]">Testing email OTP flows in Cypress using temporary API inboxes</a> by Dennis Farren (12 September 2026).</p>
      <DocsPager />
    </article>
  );
}
