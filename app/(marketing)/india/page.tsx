import type { Metadata } from 'next';
import Link from 'next/link';
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
      <h1 className="text-4xl font-bold tracking-[-0.04em]">INR billing and GST invoices</h1>
      <p className="mt-4 text-sm leading-6 text-stone-600">
        InboxRhino is built for Indian SaaS and QA teams that already write Playwright or Cypress tests and later need GST-compliant invoices. The free API is live now. Paid checkout is not.
      </p>
      <section className="mt-10 space-y-4 text-sm leading-6 text-stone-700">
        <h2 className="text-xl font-bold text-[#1C1917]">What is coming</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Razorpay checkout in INR only</li>
          <li>GST extra on the listed prices</li>
          <li>GSTIN capture and GST-compatible invoicing</li>
          <li>Starter ₹199, Growth ₹999, Scale ₹2,499 per month</li>
        </ul>
        <p>USD checkout is deferred until there is actual non-Indian paid demand. Do not expect a Stripe invoice from this product.</p>
        <p>
          Listed amounts are on the{' '}
          <Link href="/pricing" className="font-bold text-[#0F3D3E]">
            pricing
          </Link>{' '}
          page.
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
    </main>
  );
}
