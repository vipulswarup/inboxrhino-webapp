import type { Metadata } from 'next';
import Link from 'next/link';
import { CompareTable } from '@/app/compare-table';
import { PageBreadcrumbs } from '@/app/page-breadcrumbs';
import { pageMeta } from '@/app/lib/seo';

export const metadata: Metadata = pageMeta(
  '/compare/mailhog',
  'InboxRhino vs MailHog and Mailpit — when local SMTP is not enough',
  'Compare InboxRhino with MailHog and Mailpit. InboxRhino is a real MX inbox for CI. Mailpit is a free local SMTP catcher that does not receive public mail.',
);

const rows = [
  ['Real public MX', 'Yes, addresses on test.inboxrhino.in', 'No. Local SMTP on port 1025'],
  ['How mail arrives', 'Your real mailer (SES, Postmark, app SMTP) delivers to the test address', 'The app under test must send to localhost, not a public provider'],
  ['GitHub Actions / CI', 'Same wait-for-message call as on a laptop', 'Works only if you run a Mailpit service container and rewrite SMTP'],
  ['Wait-for-message API', 'Yes, up to 180s with subject/sender filters', 'Mailpit REST API on localhost:8025; MailHog API is unmaintained'],
  ['Visual HTML inbox', 'Sandboxed console on the web', 'Local UI on port 8025'],
  ['Cost', 'Free tier live: 11 inboxes / 33 emails', 'Free, self-hosted'],
  ['Maintenance', 'Hosted by InboxRhino', 'MailHog last released 2020; Mailpit is the drop-in replacement'],
  ['SMS / SDKs', 'Not in v1', 'Not applicable'],
];

export default function CompareMailhogPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <PageBreadcrumbs items={[{ name: 'InboxRhino vs MailHog and Mailpit', path: '/compare/mailhog' }]} />
      <h1 className="text-4xl font-bold tracking-[-0.04em]">InboxRhino vs MailHog and Mailpit</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-stone-600">
        MailHog and Mailpit are local SMTP catchers. They are the right tool when the application can send to localhost on a developer machine. They are the wrong tool when staging sends through a real provider to a real address, or when CI has no sidecar. InboxRhino is a hosted receive-only MX inbox for that second case. Confirm current Mailpit behaviour on{' '}
        <a href="https://mailpit.axllent.org" className="font-bold text-[#0F3D3E]" rel="noopener noreferrer">
          mailpit.axllent.org
        </a>
        . MailHog is{' '}
        <a href="https://github.com/mailhog/MailHog" className="font-bold text-[#0F3D3E]" rel="noopener noreferrer">
          unmaintained
        </a>
        ; Mailpit is the maintained replacement with the same default ports.
      </p>

      <section className="mt-10 space-y-4 text-sm leading-6 text-stone-700">
        <h2 className="text-xl font-bold text-[#1C1917]">Who each product fits</h2>
        <p>
          Use Mailpit on a laptop when you can point the app at SMTP <code className="font-mono text-xs">localhost:1025</code>, inspect messages in the local UI, and optionally query the local REST API. You can run the same container in GitHub Actions, but then the application must still send to that container, not to Amazon SES or Postmark.
        </p>
        <p>
          Use InboxRhino when the product under test already sends real mail. Create an address, wait up to 180 seconds, read the HTML in a sandboxed viewer, then delete the inbox. That path is the same in CI as on a laptop. InboxRhino does not replace Mailpit for purely local SMTP capture, and it does not send mail.
        </p>
      </section>

      <CompareTable columns={['Capability', 'InboxRhino', 'MailHog / Mailpit']} rows={rows} />

      <p className="mt-6 text-xs leading-5 text-stone-500">
        Compared on 7 September 2026 from InboxRhino&apos;s live product, Mailpit&apos;s public docs, and MailHog&apos;s GitHub status. Local-catcher behaviour can change with your Docker setup. InboxRhino paid checkout is not live.
      </p>
      <p className="mt-8 text-sm text-stone-600">
        See{' '}
        <Link href="/docs/playwright" className="font-bold text-[#0F3D3E]">
          Playwright email tests
        </Link>
        ,{' '}
        <Link href="/docs/quickstart" className="font-bold text-[#0F3D3E]">
          the API quickstart
        </Link>
        ,{' '}
        <Link href="/compare/tigrmail" className="font-bold text-[#0F3D3E]">
          InboxRhino vs Tigrmail
        </Link>
        , and{' '}
        <Link href="/compare/mailosaur" className="font-bold text-[#0F3D3E]">
          InboxRhino vs Mailosaur
        </Link>
        .
      </p>
    </main>
  );
}
