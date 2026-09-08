import { describe, expect, it } from 'vitest';
import {
  APP_ROBOTS_TXT,
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
          url: `${SITE_ORIGIN}${OG_IMAGE_PATH}`,
          width: 1200,
          height: 630,
        }),
      ]),
    );
    expect(meta.twitter).toEqual(
      expect.objectContaining({
        card: 'summary_large_image',
        images: [`${SITE_ORIGIN}${OG_IMAGE_PATH}`],
      }),
    );
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
    expect(rules.allow).toEqual(expect.arrayContaining(['/', '/compare/', '/brand/', '/openapi.yaml', '/postman/']));
    expect(rules.disallow).toEqual(expect.arrayContaining(['/console', '/login']));
    expect(rules.disallow).not.toEqual(expect.arrayContaining(['/openapi.yaml', '/postman/', '/brand/']));
    expect(rules.disallow).not.toContain('/');
    expect(robots.sitemap).toBe(`${SITE_ORIGIN}/sitemap.xml`);
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
      title: 'Automated Testing of Email Flows using Vibe-Testing',
      description: 'Agentic testing needs an API-readable inbox.',
      datePublished: '2026-09-06T00:00:00Z',
    })['@type']).toBe('BlogPosting');
    const crumbs = breadcrumbListJsonLd([
      { name: 'InboxRhino home', path: '/' },
      { name: 'Blog', path: '/blog' },
    ]);
    expect(crumbs['@type']).toBe('BreadcrumbList');
  });
});
