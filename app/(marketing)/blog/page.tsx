import type { Metadata } from 'next';
import { PageBreadcrumbs } from '@/app/page-breadcrumbs';
import { formatPostDate, getAllPosts } from '@/app/lib/blog';
import { pageMeta } from '@/app/lib/seo';

export const metadata: Metadata = pageMeta(
  '/blog',
  'InboxRhino blog — email testing for agents and CI',
  'Practical notes on agentic testing, signup verification, and receive-only inboxes for Playwright, CI, and QA teams that need a real MX address.',
);

const topics = [
  { href: '/docs/playwright', label: 'Playwright email testing' },
  { href: '/docs/quickstart', label: 'API quickstart' },
  { href: '/compare/tigrmail', label: 'InboxRhino vs Tigrmail' },
  { href: '/compare/mailosaur', label: 'Mailosaur alternative' },
  { href: '/compare/mailhog', label: 'MailHog alternative' },
  { href: '/compare/mailslurp', label: 'InboxRhino vs MailSlurp' },
  { href: '/compare/testmail', label: 'InboxRhino vs testmail.app' },
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
      </header>

      <section>
        <h2 className="text-2xl font-bold tracking-[-0.03em]">Latest posts</h2>
        <ul className="mt-6 space-y-8">
          {posts.map((post) => (
            <li key={post.slug} className="rounded-[22px] border border-[#1C1917]/10 bg-white p-6">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#0F3D3E]">
                InboxRhino · {formatPostDate(post.date)}
              </p>
              <h3 className="mt-2 text-2xl font-bold tracking-[-0.03em]">
                <a href={`/blog/${post.slug}`} className="text-[#1C1917] hover:text-[#0F3D3E]">
                  {post.title}
                </a>
              </h3>
              <p className="mt-2 text-sm leading-6 text-stone-600">{post.description}</p>
              <a href={`/blog/${post.slug}`} className="mt-4 inline-block text-sm font-bold text-[#0F3D3E]">
                Read the article
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold tracking-[-0.03em]">Guides and comparisons</h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Step-by-step setup guides, and notes on how InboxRhino differs from other email testing tools.
        </p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {topics.map((topic) => (
            <li key={topic.href} className="rounded-[22px] border border-[#1C1917]/10 bg-white px-5 py-4">
              <a href={topic.href} className="text-sm font-bold text-[#0F3D3E] hover:underline">
                {topic.label}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
