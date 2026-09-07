import Link from 'next/link';
import { headers } from 'next/headers';
import { CodeSnippet } from './code-snippet';
import { JsonLd } from './json-ld';
import { getAllPosts } from './lib/blog';
import { faqPageJsonLd, softwareApplicationJsonLd } from './lib/seo';
import { consoleHref, homeFaqs, waitSnippet } from './lib/site';
import { MessageViewer } from './message-viewer';
import { PricingGrid } from './pricing-grid';

const reasons = [
  {
    title: 'Real MX',
    body: 'Addresses on test.inboxrhino.in receive real mail through Cloudflare. This is not a local SMTP sandbox.',
  },
  {
    title: 'Visual debug',
    body: 'Open the actual HTML in a sandboxed viewer. QA can see the email, not just assert on JSON.',
  },
  {
    title: 'Wait-for-message API',
    body: 'One request waits up to 180 seconds, filters by subject or sender, and returns the parsed body.',
  },
];

export async function MarketingHome() {
  const loginHref = consoleHref((await headers()).get('host'), '/login');
  const latestPost = getAllPosts()[0];
  return (
    <main>
      <JsonLd data={softwareApplicationJsonLd()} />
      <JsonLd data={faqPageJsonLd(homeFaqs)} />
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center lg:py-20">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0F3D3E]">Receive-only test email API</p>
          <h1 className="mt-4 text-4xl font-bold tracking-[-0.04em] text-[#1C1917] sm:text-5xl">
            Real inboxes for your tests. Create an address, wait for the email, open it in the browser.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-stone-600">
            InboxRhino gives developers and QA teams a real MX inbox for signup verification, password resets, magic links, and OTPs. No SDKs required.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={loginHref} className="rounded-lg bg-[#0F3D3E] px-4 py-2.5 text-sm font-bold text-white">
              Create a free test inbox
            </a>
            <Link href="/docs/quickstart" className="rounded-lg border border-[#1C1917]/15 px-4 py-2.5 text-sm font-bold text-[#1C1917]">
              Read the InboxRhino API quickstart
            </Link>
          </div>
        </div>
        <CodeSnippet code={waitSnippet} />
      </section>

      <section className="border-y border-[#1C1917]/10 bg-[#F7F4EF] py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold tracking-[-0.03em]">Open the real email, safely</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
            The console is a sandboxed mailbox viewer. Scripts, forms, popups, and remote images are blocked.
          </p>
          <div className="mt-8 overflow-hidden rounded-[22px] border border-[#1C1917]/10 bg-white">
            <MessageViewer embed />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-16 sm:px-6 md:grid-cols-3">
        {reasons.map((reason) => (
          <article key={reason.title} className="rounded-[22px] border border-[#1C1917]/10 bg-white p-6">
            <h3 className="text-lg font-bold">{reason.title}</h3>
            <p className="mt-3 text-sm leading-6 text-stone-600">{reason.body}</p>
          </article>
        ))}
      </section>

      <section className="border-y border-[#1C1917]/10 bg-[#F7F4EF] py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-[-0.03em]">Pricing</h2>
              <p className="mt-2 text-sm text-stone-600">Free is live. Paid INR plans are listed and marked coming soon. GST extra.</p>
            </div>
            <Link href="/pricing" className="text-sm font-bold text-[#0F3D3E]">
              InboxRhino pricing and quotas
            </Link>
          </div>
          <PricingGrid compact />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-bold tracking-[-0.03em]">Explore</h2>
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          <li className="rounded-[22px] border border-[#1C1917]/10 bg-white p-5">
            <Link href="/docs" className="font-bold text-[#0F3D3E] hover:underline">
              InboxRhino documentation
            </Link>
            <p className="mt-2 text-sm leading-6 text-stone-600">Quickstart, API reference, and Playwright examples for wait-for-message tests.</p>
          </li>
          <li className="rounded-[22px] border border-[#1C1917]/10 bg-white p-5">
            <Link href="/compare/tigrmail" className="font-bold text-[#0F3D3E] hover:underline">
              Compare InboxRhino and Tigrmail
            </Link>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              Feature-by-feature notes for teams choosing a receive-only inbox API. Also see{' '}
              <Link href="/compare/mailosaur" className="font-bold text-[#0F3D3E] hover:underline">
                InboxRhino vs Mailosaur
              </Link>
              {' and '}
              <Link href="/compare/mailhog" className="font-bold text-[#0F3D3E] hover:underline">
                InboxRhino vs MailHog
              </Link>
              .
            </p>
          </li>
          <li className="rounded-[22px] border border-[#1C1917]/10 bg-white p-5">
            <Link href="/india" className="font-bold text-[#0F3D3E] hover:underline">
              INR billing and GST invoices
            </Link>
            <p className="mt-2 text-sm leading-6 text-stone-600">Who the India page is for, checkout status, and how GST will be handled.</p>
          </li>
          <li className="rounded-[22px] border border-[#1C1917]/10 bg-white p-5">
            {latestPost ? (
              <>
                <Link href={`/blog/${latestPost.slug}`} className="font-bold text-[#0F3D3E] hover:underline">
                  {latestPost.title}
                </Link>
                <p className="mt-2 text-sm leading-6 text-stone-600">{latestPost.description}</p>
              </>
            ) : (
              <>
                <Link href="/blog" className="font-bold text-[#0F3D3E] hover:underline">
                  InboxRhino blog
                </Link>
                <p className="mt-2 text-sm leading-6 text-stone-600">Notes on agentic testing and email verification in CI.</p>
              </>
            )}
          </li>
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <h2 className="text-2xl font-bold tracking-[-0.03em]">FAQ</h2>
        <dl className="mt-8 divide-y divide-[#1C1917]/10 border-y border-[#1C1917]/10">
          {homeFaqs.map((item) => (
            <div key={item.q} className="grid gap-2 py-5 md:grid-cols-[240px_minmax(0,1fr)]">
              <dt className="font-bold">{item.q}</dt>
              <dd className="text-sm leading-6 text-stone-600">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
