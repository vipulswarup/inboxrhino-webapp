import type { Metadata } from 'next';
import Link from 'next/link';
import { pageMeta } from '@/app/lib/seo';

export const metadata: Metadata = pageMeta(
  '/compare/tigrmail',
  'InboxRhino vs Tigrmail — visual inbox and named API keys',
  'Compare InboxRhino and Tigrmail for receive-only email testing. InboxRhino adds a sandboxed HTML inbox, multiple API keys, and INR billing designed for Indian teams.',
);

const rows = [
  ['Receive-only test inboxes', 'Yes', 'Yes'],
  ['Wait-for-message API', 'Yes, up to 180s', 'Yes'],
  ['Visual HTML inbox', 'Yes, sandboxed', 'Weak / limited'],
  ['Multiple named API keys', 'Yes, rotate by revoke', 'Single key, awkward rotation'],
  ['Easy inbox delete / quota release', 'Yes', 'Awkward'],
  ['Free tier', '11 inboxes / 33 emails', '10 inboxes / 30 emails'],
  ['INR / GST billing', 'Coming soon', 'No'],
  ['SDKs / OTP extraction', 'Not in v1', 'Limited'],
];

export default function CompareTigrmailPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h1 className="text-4xl font-bold tracking-[-0.04em]">InboxRhino vs Tigrmail</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-stone-600">
        Both are receive-only APIs for automated tests. InboxRhino leads with a visual mailbox and named API keys. Indian GST invoicing is designed and marked coming soon; it is not live yet.
      </p>
      <div className="mt-10 overflow-x-auto rounded-[22px] border border-[#1C1917]/10 bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-[#1C1917]/10 bg-[#F7F4EF] text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3 font-bold">Capability</th>
              <th className="px-4 py-3 font-bold">InboxRhino</th>
              <th className="px-4 py-3 font-bold">Tigrmail</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row[0]} className="border-b border-[#1C1917]/10 last:border-0">
                <td className="px-4 py-3 text-stone-700">{row[0]}</td>
                <td className="px-4 py-3 text-stone-700">{row[1]}</td>
                <td className="px-4 py-3 text-stone-700">{row[2]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-8 text-sm text-stone-600">
        See <Link href="/pricing" className="font-bold text-[#0F3D3E]">pricing</Link> and the{' '}
        <Link href="/docs/quickstart" className="font-bold text-[#0F3D3E]">quickstart</Link>.
      </p>
    </main>
  );
}
