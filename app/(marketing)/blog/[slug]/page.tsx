import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatPostDate, getAllPosts, getPostBySlug } from '@/app/lib/blog';
import { pageMeta } from '@/app/lib/seo';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  const meta = pageMeta(`/blog/${post.slug}`, post.title, post.description);
  return {
    ...meta,
    openGraph: {
      ...meta.openGraph,
      type: 'article',
      publishedTime: post.date || undefined,
    },
  };
}

const proseClassName = [
  'space-y-4 text-sm leading-6 text-stone-700',
  '[&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-[#1C1917]',
  '[&_p]:leading-6',
  '[&_strong]:font-bold [&_strong]:text-[#1C1917]',
  '[&_a]:font-bold [&_a]:text-[#0F3D3E]',
  '[&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5',
  '[&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5',
  '[&_li]:leading-6',
  '[&_pre]:mt-4 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-[#1C1917] [&_pre]:p-4 [&_pre]:text-xs [&_pre]:leading-5 [&_pre]:text-[#F7F4EF]',
  '[&_code]:rounded [&_code]:bg-[#1C1917]/8 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.9em]',
  '[&_pre_code]:bg-transparent [&_pre_code]:p-0',
].join(' ');

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#0F3D3E]">
        <Link href="/blog" className="hover:underline">
          Blog
        </Link>
        {' · '}
        {formatPostDate(post.date)}
      </p>
      <h1 className="mt-4 text-4xl font-bold tracking-[-0.04em]">{post.title}</h1>
      <p className="mt-4 text-sm leading-6 text-stone-600">{post.description}</p>
      <article className={`mt-10 ${proseClassName}`} dangerouslySetInnerHTML={{ __html: post.html }} />
    </main>
  );
}
