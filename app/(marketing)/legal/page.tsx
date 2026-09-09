import type { Metadata } from 'next';
import Link from 'next/link';
import { PageBreadcrumbs } from '@/app/page-breadcrumbs';
import { CONTACT_EMAIL, SITE_ORIGIN } from '@/app/lib/site';
import { pageMeta } from '@/app/lib/seo';

export const metadata: Metadata = pageMeta(
  '/legal',
  'InboxRhino privacy policy and terms of service',
  'Privacy policy and terms for InboxRhino, the receive-only test email API. Covers account data, 30-day message retention, auth and infrastructure.',
);

export default function LegalPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-12 px-4 py-16 sm:px-6">
      <PageBreadcrumbs items={[{ name: 'Privacy and terms', path: '/legal' }]} />
      <header>
        <h1 className="text-4xl font-bold tracking-[-0.04em]">Privacy and terms</h1>
        <p className="mt-4 text-sm leading-6 text-stone-600">
          These terms apply to the free InboxRhino service at{' '}
          <Link href="/" className="font-bold text-[#0F3D3E]">
            {SITE_ORIGIN}
          </Link>
          . Contact{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-bold text-[#0F3D3E]">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </header>

      <section className="space-y-4 text-sm leading-6 text-stone-700">
        <h2 className="text-2xl font-bold text-[#1C1917]">Privacy</h2>
        <p>
          We process account data (email, display name, signup country from Cloudflare&apos;s CF-IPCountry header), organisation membership, API key hashes, inbox addresses, and received message content so the product can work.
        </p>
        <p>
          Received messages, HTML, text, headers, and attachments are kept for 30 days, then deleted from the live service. Deleting an inbox or message removes stored objects immediately. Cloudflare D1 Time Travel may retain earlier database states for up to 30 additional days for disaster recovery only. Message bodies in R2 are not backed up.
        </p>
        <p>
          Authentication is provided by Firebase Authentication. Infrastructure runs on Cloudflare (Workers, D1, R2, Email Routing). We use Google Analytics on inboxrhino.in and app.inboxrhino.in to measure page views, device/browser type, and approximate location. We do not send received email content, API keys, or message bodies to Google Analytics. Google processes this data under its own privacy policy. We do not sell inbound message content. Operational logs retain seven days and must not include message bodies, headers, attachment names, or secrets.
        </p>
        <p>Attachments are not malware-scanned. Download them only if you trust the sender.</p>
      </section>

      <section className="space-y-4 text-sm leading-6 text-stone-700">
        <h2 className="text-2xl font-bold text-[#1C1917]">Terms</h2>
        <p>
          InboxRhino is a receive-only testing service. You may not use it as a public disposable-mail website, to send mail, or to abuse third-party services. Test inboxes cannot send, reply, or forward.
        </p>
        <p>
          The free tier allows 11 active inboxes, 33 inbound emails per UTC calendar month, and one organisation user. When the monthly email quota is exhausted, further inbound mail is rejected. We may suspend accounts that exhaust resources or violate these terms.
        </p>
        <p>
          The service is provided as-is during the free launch. Paid plans, SLA, and GST invoices are not part of this launch. We may change limits with notice on this site. Company details are on the{' '}
          <Link href="/about" className="font-bold text-[#0F3D3E]">
            about page
          </Link>
          . Quota numbers match{' '}
          <Link href="/pricing" className="font-bold text-[#0F3D3E]">
            InboxRhino pricing
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
