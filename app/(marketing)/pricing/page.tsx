import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { JsonLd } from '@/app/json-ld';
import { PageBreadcrumbs } from '@/app/page-breadcrumbs';
import { PricingGrid } from '@/app/pricing-grid';
import { softwareApplicationJsonLd, pageMeta } from '@/app/lib/seo';
import { consoleHref } from '@/app/lib/site';

export const metadata: Metadata = pageMeta(
  '/pricing',
  'InboxRhino pricing — Free and Starter access live',
  'Free InboxRhino includes 11 inboxes and 33 emails per month. Starter is available with an access code; paid checkout is not open.',
);

export default async function PricingPage() {
  const loginHref = consoleHref((await headers()).get('host'), '/login');
  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <JsonLd data={softwareApplicationJsonLd()} />
      <PageBreadcrumbs items={[{ name: 'Pricing', path: '/pricing' }]} />
      <h1 className="text-4xl font-bold tracking-[-0.04em]">Pricing</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-stone-600">
        Free is available worldwide. Starter can be activated at no charge with an access code in the console. Paid checkout is not available yet.
      </p>
      <div className="mt-10">
        <PricingGrid />
      </div>

      <section className="mt-12 grid gap-6 md:grid-cols-2">
        <article className="rounded-[22px] border border-[#1C1917]/10 bg-white p-6 text-sm leading-6 text-stone-700">
          <h2 className="text-xl font-bold text-[#1C1917]">How quotas work</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5">
            <li>Active inboxes count toward the inbox cap until you delete them. Deleting an inbox frees that slot immediately.</li>
            <li>Inbound email quota is per UTC calendar month. Deleting a message does not restore monthly quota.</li>
            <li>When the monthly email quota is exhausted, further SMTP is rejected. The message is not stored.</li>
            <li>Messages, HTML, headers, and attachments are retained for 30 days, then deleted.</li>
          </ul>
        </article>
        <article className="rounded-[22px] border border-[#1C1917]/10 bg-white p-6 text-sm leading-6 text-stone-700">
          <h2 className="text-xl font-bold text-[#1C1917]">Billing status</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5">
            <li>Free and code activated Starter are live. There is no billing or overage charge; the API and SMTP reject work that exceeds your plan cap.</li>
            <li>Starter, Growth, and Scale prices are for planning only. Checkout is not open, so no paid subscription is available.</li>
            <li>When paid checkout ships, GST will be added on top of the listed INR amount. See{' '}
              <a href="/india" className="font-bold text-[#0F3D3E]">
                INR billing and GST invoices
              </a>
              .
            </li>
            <li>
              If you have a Starter access code, sign in and redeem it on the Usage tab. No payment details are required.
            </li>
          </ul>
        </article>
      </section>

      <p className="mt-8 text-sm text-stone-600">
        <a href={loginHref} className="font-bold text-[#0F3D3E]">
          Create a free test inbox
        </a>
        {' · '}
        <a href="/docs/quickstart" className="font-bold text-[#0F3D3E]">
          Read the InboxRhino API quickstart
        </a>
        {' · '}
        <a href="/legal" className="font-bold text-[#0F3D3E]">
          Privacy and terms
        </a>
      </p>
    </main>
  );
}
