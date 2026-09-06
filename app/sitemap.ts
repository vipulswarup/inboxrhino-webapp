import { getAllPosts } from './lib/blog';
import { buildSitemap } from './lib/seo';

export default function sitemap() {
  return buildSitemap(getAllPosts());
}
