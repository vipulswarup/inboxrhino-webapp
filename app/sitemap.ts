import type { MetadataRoute } from 'next';
import { SITE_ORIGIN } from './lib/site';

const paths = ['/', '/about', '/pricing', '/docs/quickstart', '/docs/api', '/docs/playwright', '/compare/tigrmail', '/india', '/legal'];

export default function sitemap(): MetadataRoute.Sitemap {
  return paths.map((path) => ({
    url: path === '/' ? SITE_ORIGIN : `${SITE_ORIGIN}${path}`,
    changeFrequency: path === '/' ? 'weekly' : 'monthly',
    priority: path === '/' ? 1 : 0.7,
  }));
}
