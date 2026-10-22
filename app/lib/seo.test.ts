import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getAllPosts } from './blog';
import { OG_IMAGE_PAGES } from './og-images';
import {
  APP_ROBOTS_TXT,
  MARKETING_PAGE_CACHE_CONTROL,
  PAGE_LAST_MODIFIED,
  PUBLIC_PATHS,
  absoluteUrl,
  brandNode,
  blogPostingJsonLd,
  breadcrumbListJsonLd,
  buildRobots,
  buildSitemap,
  faqPageJsonLd,
  isAppHost,
  isNoindexPath,
  marketingCacheControl,
  ogImagePath,
  organizationNode,
  pageMeta,
  robotsHeaderValue,
  siteGraphJsonLd,
  softwareApplicationJsonLd,
} from './seo';
import { OG_IMAGE_PATH, SITE_ORIGIN, homeFaqs } from './site';

describe('SEO helpers', () => {
  it('emits a unique title, description, self-canonical, OG image, and large Twitter card', () => {
    const meta = pageMeta('/pricing', 'Pricing title', 'A benefit-led description that explains quotas and that free is live now.');
    expect(meta.title).toEqual({ absolute: 'Pricing title' });
    expect(meta.description).toMatch(/free is live/i);
    expect(meta.alternates).toEqual({ canonical: `${SITE_ORIGIN}/pricing` });
    expect(meta.openGraph?.images).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          url: `${SITE_ORIGIN}/brand/og/pricing.png`,
          alt: 'Pricing title',
          width: 1200,
          height: 630,
        }),
      ]),
    );
    expect(meta.twitter).toEqual(
      expect.objectContaining({
        card: 'summary_large_image',
        images: [`${SITE_ORIGIN}/brand/og/pricing.png`],
      }),
    );
  });

  it('gives every public page and blog post its own generated OG image', () => {
    const paths = [...PUBLIC_PATHS.filter((path) => path !== '/'), ...getAllPosts().map((post) => `/blog/${post.slug}`)];
    for (const path of paths) {
      expect(OG_IMAGE_PAGES.has(path), `${path} missing; run scripts/generate-og-images.py`).toBe(true);
    }
    for (const path of OG_IMAGE_PAGES) {
      expect(existsSync(join(process.cwd(), 'public', ogImagePath(path))), path).toBe(true);
    }
    expect(ogImagePath('/')).toBe(OG_IMAGE_PATH);
    expect(pageMeta('/docs/api', 'T', 'D').openGraph?.images).toEqual([
      expect.objectContaining({ url: `${SITE_ORIGIN}/brand/og/docs/api.png` }),
    ]);
  });

  it('keeps the blog index meta description in the 140–160 review range', () => {
    const description =
      'Practical notes on agentic testing, signup verification, and receive-only inboxes for Playwright, CI, and QA teams that need a real MX address.';
    expect(description.length).toBeGreaterThanOrEqual(140);
    expect(description.length).toBeLessThanOrEqual(160);
  });

  it('builds robots.txt that allows the public site, points at the sitemap, and does not disallow /', () => {
    const robots = buildRobots();
    const rules = Array.isArray(robots.rules) ? robots.rules[0] : robots.rules;
    expect(rules.allow).toBe('/');
    expect(rules.disallow).toEqual(expect.arrayContaining(['/console', '/login']));
    expect(robots).not.toHaveProperty('host');
    expect(rules.disallow).not.toEqual(expect.arrayContaining(['/openapi.yaml', '/postman/', '/brand/']));
    expect(rules.disallow).not.toContain('/');
    expect(robots.sitemap).toEqual([
      `${SITE_ORIGIN}/sitemap.xml`,
      `${SITE_ORIGIN}/news/sitemap.xml`,
    ]);
  });

  it('includes only indexable public paths in the sitemap', () => {
    const entries = buildSitemap([{ slug: 'agentic-testing-email-flows', date: '2026-09-06' }]);
    const urls = entries.map((entry) => entry.url);
    for (const path of PUBLIC_PATHS) {
      expect(urls).toContain(absoluteUrl(path));
    }
    expect(urls).toContain(`${SITE_ORIGIN}/blog/agentic-testing-email-flows`);
    expect(urls).not.toContain(`${SITE_ORIGIN}/login`);
    expect(urls).not.toContain(`${SITE_ORIGIN}/console`);
    expect(entries.find((entry) => entry.url.endsWith('/blog/agentic-testing-email-flows'))?.lastModified).toBeInstanceOf(Date);
  });

  it('gives every public page a valid sitemap lastmod', () => {
    const entries = buildSitemap([]);
    for (const path of PUBLIC_PATHS) {
      expect(PAGE_LAST_MODIFIED[path], path).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      const lastModified = entries.find((entry) => entry.url === absoluteUrl(path))?.lastModified;
      expect(lastModified instanceof Date && !Number.isNaN(lastModified.getTime()), path).toBe(true);
    }
  });

  it('lets browsers keep marketing HTML but not app, login, console, news, or assets', () => {
    expect(marketingCacheControl('inboxrhino.in', '/pricing')).toBe(MARKETING_PAGE_CACHE_CONTROL);
    expect(marketingCacheControl('inboxrhino.in', '/')).toBe(MARKETING_PAGE_CACHE_CONTROL);
    expect(MARKETING_PAGE_CACHE_CONTROL).not.toMatch(/no-store|private/);
    expect(marketingCacheControl('app.inboxrhino.in', '/')).toBeNull();
    expect(marketingCacheControl('inboxrhino.in', '/login')).toBeNull();
    expect(marketingCacheControl('inboxrhino.in', '/console/inboxes')).toBeNull();
    expect(marketingCacheControl('inboxrhino.in', '/news')).toBeNull();
    expect(marketingCacheControl('inboxrhino.in', '/news/desk')).toBeNull();
    expect(marketingCacheControl('inboxrhino.in', '/brand/og-default.png')).toBeNull();
  });

  it('marks app, login, and console routes as noindex utility surfaces', () => {
    expect(isAppHost('app.inboxrhino.in')).toBe(true);
    expect(isNoindexPath('/login')).toBe(true);
    expect(isNoindexPath('/console')).toBe(true);
    expect(isNoindexPath('/pricing')).toBe(false);
    expect(robotsHeaderValue('inboxrhino.in', '/openapi.yaml')).toBe('noindex, follow');
    expect(robotsHeaderValue('inboxrhino.in', '/postman/InboxRhino.postman_collection.json')).toBe('noindex, follow');
    expect(robotsHeaderValue('inboxrhino.in', '/brand/logo-wordmark.svg')).toBeNull();
    expect(robotsHeaderValue('app.inboxrhino.in', '/pricing')).toBe('noindex, nofollow');
    expect(APP_ROBOTS_TXT).toContain('Disallow: /');
  });

  it('emits Organization, WebSite, FAQ, Product, Article, and Breadcrumb JSON-LD', () => {
    const site = JSON.stringify(siteGraphJsonLd());
    expect(site).toContain('Organization');
    expect(site).toContain('Brand');
    expect(site).toContain('WebSite');
    expect(organizationNode()).toEqual(expect.objectContaining({ name: 'Argali Knowledge Services Pvt Ltd', url: 'https://argali.in' }));
    expect(organizationNode()).not.toHaveProperty('sameAs');
    expect(brandNode()).toEqual(expect.objectContaining({ name: 'InboxRhino', url: SITE_ORIGIN }));
    expect(faqPageJsonLd(homeFaqs)['@type']).toBe('FAQPage');
    expect(softwareApplicationJsonLd()['@type']).toBe('SoftwareApplication');
    expect(blogPostingJsonLd({
      path: '/blog/agentic-testing-email-flows',
      title: 'Agentic Testing of Email Flows: Signup, OTP and Password Reset',
      description: 'Agentic testing needs an API-readable inbox.',
      datePublished: '2026-09-06T00:00:00Z',
    })['@type']).toBe('BlogPosting');
    expect(blogPostingJsonLd({
      path: '/blog/agentic-testing-email-flows',
      title: 'Agentic Testing of Email Flows',
      description: 'Agentic testing needs an API-readable inbox.',
      datePublished: '2026-09-06T00:00:00Z',
      author: 'Jane Writer',
    }).author).toEqual(expect.objectContaining({ '@type': 'Person', name: 'Jane Writer' }));
    const crumbs = breadcrumbListJsonLd([
      { name: 'InboxRhino home', path: '/' },
      { name: 'Blog', path: '/blog' },
    ]);
    expect(crumbs['@type']).toBe('BreadcrumbList');
  });
});
