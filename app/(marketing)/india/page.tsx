import type { Metadata } from 'next';
import Link from 'next/link';
import { PageBreadcrumbs } from '@/app/page-breadcrumbs';
import { CONTACT_EMAIL } from '@/app/lib/site';
import { pageMeta } from '@/app/lib/seo';

export const metadata: Metadata = pageMeta(
  '/india',
  'InboxRhino for India — INR pricing and GST invoices',
  'InboxRhino is built for Indian SaaS and QA teams. The free test-email API is live now. Paid plans will checkout in INR through Razorpay with GST invoices. Checkout is not open yet.',
);

export default function IndiaPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <PageBreadcrumbs items={[{ name: 'INR billing and GST', path: '/india' }]} />
      <h1 className="text-4xl font-bold tracking-[-0.04em]">INR billing and GST invoices</h1>
      <p className="mt-4 text-sm leading-6 text-stone-600">
        This page is for Indian SaaS and QA teams that already write Playwright or Cypress tests and will later need GST-compliant invoices. The free API is live now. Paid checkout is not.
      </p>
      <section className="mt-10 space-y-4 text-sm leading-6 text-stone-700">
        <h2 className="text-xl font-bold text-[#1C1917]">What is live vs coming</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Live: free tier, real MX on test.inboxrhino.in, wait-for-message API, sandboxed viewer.</li>
          <li>Coming: Razorpay checkout in INR only, GST extra on listed prices, GSTIN capture, GST-compatible invoicing.</li>
          <li>Listed paid amounts: Starter ₹199, Growth ₹999, Scale ₹2,499 per month before GST. See the{' '}
            <Link href="/pricing" className="font-bold text-[#0F3D3E]">
              pricing page
            </Link>
            .
          </li>
        </ul>
        <p>USD checkout is deferred until there is actual non-Indian paid demand. Do not expect a Stripe invoice from this product.</p>
      </section>
      <section className="mt-10 space-y-4 text-sm leading-6 text-stone-700">
        <h2 className="text-xl font-bold text-[#1C1917]">GST treatment</h2>
        <p>
          When paid plans launch, GST will be charged extra on the listed INR price. The checkout flow will collect GSTIN so invoices can be issued to Indian businesses. Until checkout ships, there is no paid invoice and no GST charged.
        </p>
      </section>
      <section className="mt-10 space-y-4 text-sm leading-6 text-stone-700">
        <h2 className="text-xl font-bold text-[#1C1917]">Infrastructure</h2>
        <p>
          The API, console, and mail pipeline run on Cloudflare (Workers, D1, R2, Email Routing). That is a global edge network. This page does not claim India-only data residency.
        </p>
      </section>
      <section className="mt-10 rounded-[22px] border border-[#1C1917]/10 bg-white p-6">
        <h2 className="text-xl font-bold">Register interest</h2>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          If you need INR invoices before checkout ships, email{' '}
          <a href={`mailto:${CONTACT_EMAIL}?subject=INR%20billing%20interest`} className="font-bold text-[#0F3D3E]">
            {CONTACT_EMAIL}
          </a>{' '}
          with your company name and expected volume. This is an interest list, not a paid plan.
        </p>
      </section>
      <p className="mt-8 text-sm text-stone-600">
        <Link href="/docs/quickstart" className="font-bold text-[#0F3D3E]">
          Read the InboxRhino API quickstart
        </Link>
        {' · '}
        <Link href="/about" className="font-bold text-[#0F3D3E]">
          About Argali and InboxRhino
        </Link>
      </p>
    </main>
  );
}
