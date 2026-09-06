import type { MetadataRoute } from 'next';
import { getAllPosts } from './lib/blog';
import { SITE_ORIGIN } from './lib/site';

const paths = [
  '/',
  '/about',
  '/pricing',
  '/blog',
  '/docs/quickstart',
  '/docs/api',
  '/docs/playwright',
  '/compare/tigrmail',
  '/india',
  '/legal',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = paths.map((path) => ({
    url: path === '/' ? SITE_ORIGIN : `${SITE_ORIGIN}${path}`,
    changeFrequency: path === '/' || path === '/blog' ? ('weekly' as const) : ('monthly' as const),
    priority: path === '/' ? 1 : 0.7,
  }));

  const posts = getAllPosts().map((post) => ({
    url: `${SITE_ORIGIN}/blog/${post.slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
    lastModified: post.date ? new Date(`${post.date}T00:00:00Z`) : undefined,
  }));

  return [...pages, ...posts];
}
