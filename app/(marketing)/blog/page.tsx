import type { Metadata } from 'next';
import Link from 'next/link';
import { formatPostDate, getAllPosts } from '@/app/lib/blog';
import { pageMeta } from '@/app/lib/seo';

export const metadata: Metadata = pageMeta(
  '/blog',
  'InboxRhino blog — email testing for agents and CI',
  'Notes on agentic testing, email verification flows, and receive-only inboxes for Playwright and QA.',
);

export default function BlogIndexPage() {
  const posts = getAllPosts();
  return (
    <main className="mx-auto max-w-3xl space-y-12 px-4 py-16 sm:px-6">
      <header>
        <h1 className="text-4xl font-bold tracking-[-0.04em]">Blog</h1>
        <p className="mt-4 text-sm leading-6 text-stone-600">
          Email testing, agentic QA, and notes from building InboxRhino.
        </p>
      </header>

      <ul className="space-y-8">
        {posts.map((post) => (
          <li key={post.slug}>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#0F3D3E]">
              {formatPostDate(post.date)}
            </p>
            <Link
              href={`/blog/${post.slug}`}
              className="mt-2 block text-2xl font-bold tracking-[-0.03em] text-[#1C1917] hover:text-[#0F3D3E]"
            >
              {post.title}
            </Link>
            <p className="mt-2 text-sm leading-6 text-stone-600">{post.description}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
