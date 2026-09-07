import type { Metadata } from 'next';
import Link from 'next/link';
import { PageBreadcrumbs } from '@/app/page-breadcrumbs';
import { formatPostDate, getAllPosts } from '@/app/lib/blog';
import { pageMeta } from '@/app/lib/seo';

export const metadata: Metadata = pageMeta(
  '/blog',
  'InboxRhino blog — email testing for agents and CI',
  'Practical notes on agentic testing, signup verification, and receive-only inboxes for Playwright, CI, and QA teams that need a real MX address.',
);

const topics = [
  { href: '/docs/playwright', label: 'Playwright email tests' },
  { href: '/docs/quickstart', label: 'API quickstart' },
  { href: '/compare/tigrmail', label: 'InboxRhino vs Tigrmail' },
  { href: '/compare/mailosaur', label: 'InboxRhino vs Mailosaur' },
  { href: '/compare/mailhog', label: 'InboxRhino vs MailHog' },
];

export default function BlogIndexPage() {
  const posts = getAllPosts();
  return (
    <main className="mx-auto max-w-3xl space-y-12 px-4 py-16 sm:px-6">
      <PageBreadcrumbs items={[{ name: 'Blog', path: '/blog' }]} />
      <header>
        <h1 className="text-4xl font-bold tracking-[-0.04em]">Blog</h1>
        <p className="mt-4 text-sm leading-6 text-stone-600">
          Writing from the InboxRhino team on agentic QA, signup and password-reset flows, and receive-only inboxes that CI can actually read. Posts are practical: what to specify for an agent, which APIs to call, and where local catchers fall short.
        </p>
        <p className="mt-4 text-sm leading-6 text-stone-600">
          Topics:{' '}
          {topics.map((topic, index) => (
            <span key={topic.href}>
              {index > 0 ? ' · ' : null}
              <Link href={topic.href} className="font-bold text-[#0F3D3E]">
                {topic.label}
              </Link>
            </span>
          ))}
        </p>
      </header>

      <ul className="space-y-8">
        {posts.map((post) => (
          <li key={post.slug} className="rounded-[22px] border border-[#1C1917]/10 bg-white p-6">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#0F3D3E]">
              InboxRhino · {formatPostDate(post.date)}
            </p>
            <Link
              href={`/blog/${post.slug}`}
              className="mt-2 block text-2xl font-bold tracking-[-0.03em] text-[#1C1917] hover:text-[#0F3D3E]"
            >
              {post.title}
            </Link>
            <p className="mt-2 text-sm leading-6 text-stone-600">{post.description}</p>
            <Link href={`/blog/${post.slug}`} className="mt-4 inline-block text-sm font-bold text-[#0F3D3E]">
              Read the article
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
