import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { PricingGrid } from '@/app/pricing-grid';
import { consoleHref } from '@/app/lib/site';
import { pageMeta } from '@/app/lib/seo';

export const metadata: Metadata = pageMeta(
  '/pricing',
  'InboxRhino pricing — free tier live, INR plans coming soon',
  'Free InboxRhino includes 11 inboxes and 33 emails per month. Starter, Growth and Scale will checkout in INR with GST extra. Paid checkout is not open yet.',
);

export default async function PricingPage() {
  const loginHref = consoleHref((await headers()).get('host'), '/login');
  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h1 className="text-4xl font-bold tracking-[-0.04em]">Pricing</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-stone-600">
        The free tier is live worldwide. Paid plans will checkout in INR through Razorpay, with GST extra. Annual prices are 10% off 12 months. USD billing is not offered at first launch.
      </p>
      <div className="mt-10">
        <PricingGrid />
      </div>
      <p className="mt-8 text-sm text-stone-600">
        <a href={loginHref} className="font-bold text-[#0F3D3E]">
          Start on the free tier
        </a>
        . Paid checkout is not available yet.
      </p>
      <p className="mt-4 text-sm text-stone-600">
        <Link href="/docs/quickstart" className="font-bold text-[#0F3D3E]">
          Quickstart
        </Link>
        {' · '}
        <Link href="/india" className="font-bold text-[#0F3D3E]">
          INR and GST
        </Link>
      </p>
    </main>
  );
}
