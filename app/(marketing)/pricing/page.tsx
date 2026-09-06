import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { JsonLd } from '@/app/json-ld';
import { PageBreadcrumbs } from '@/app/page-breadcrumbs';
import { PricingGrid } from '@/app/pricing-grid';
import { softwareApplicationJsonLd, pageMeta } from '@/app/lib/seo';
import { consoleHref } from '@/app/lib/site';

export const metadata: Metadata = pageMeta(
  '/pricing',
  'InboxRhino pricing — free tier live, INR plans coming soon',
  'Free InboxRhino includes 11 inboxes and 33 emails per month. Starter, Growth and Scale will checkout in INR with GST extra. Paid checkout is not open yet.',
);

export default async function PricingPage() {
  const loginHref = consoleHref((await headers()).get('host'), '/login');
  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <JsonLd data={softwareApplicationJsonLd()} />
      <PageBreadcrumbs items={[{ name: 'Pricing', path: '/pricing' }]} />
      <h1 className="text-4xl font-bold tracking-[-0.04em]">Pricing</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-stone-600">
        The free tier is live worldwide. Paid plans will checkout in INR through Razorpay, with GST extra. Annual prices are 10% off 12 months. USD billing is not offered at first launch.
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
            <li>Free is the only live plan today. There is no overage billing; the API and SMTP reject work that exceeds the free cap.</li>
            <li>Starter, Growth, and Scale prices are listed so teams can plan. Checkout is not open, so those prices are not a current offer.</li>
            <li>When paid checkout ships, GST will be added on top of the listed INR amount. See{' '}
              <Link href="/india" className="font-bold text-[#0F3D3E]">
                INR billing and GST invoices
              </Link>
              .
            </li>
            <li>
              Upgrade path: stay on free until checkout launches, or email interest volume from the India page. There is no self-serve paid upgrade yet.
            </li>
          </ul>
        </article>
      </section>

      <p className="mt-8 text-sm text-stone-600">
        <a href={loginHref} className="font-bold text-[#0F3D3E]">
          Create a free test inbox
        </a>
        {' · '}
        <Link href="/docs/quickstart" className="font-bold text-[#0F3D3E]">
          Read the InboxRhino API quickstart
        </Link>
        {' · '}
        <Link href="/legal" className="font-bold text-[#0F3D3E]">
          Privacy and terms
        </Link>
      </p>
    </main>
  );
}
