#!/usr/bin/env node

const SITE_ORIGIN = 'https://inboxrhino.in';
const OG_IMAGE_PATH = '/brand/og-default.png';
const origin = process.env.SEO_ORIGIN || SITE_ORIGIN;
const PUBLIC_PATHS = [
  '/',
  '/about',
  '/pricing',
  '/blog',
  '/docs',
  '/docs/quickstart',
  '/docs/api',
  '/docs/playwright',
  '/compare/tigrmail',
  '/india',
  '/legal',
];

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

async function get(path, options = {}) {
  const url = path.startsWith('http') ? path : `${origin}${path}`;
  const response = await fetch(url, { redirect: options.redirect || 'manual', headers: options.headers });
  const text = options.skipBody ? '' : await response.text();
  return { response, text, url };
}

function assertStatus(path, response, expected) {
  if (response.status !== expected) fail(`${path} expected HTTP ${expected}, got ${response.status}`);
}

function pageHtml(html) {
  return html.replace(/<iframe\b[\s\S]*?<\/iframe>/gi, '').replace(/\ssrcdoc="[^"]*"/gi, '');
}

function countH1(html) {
  return (pageHtml(html).match(/<h1\b/gi) || []).length;
}

function hasOutgoingLink(html) {
  return /<a\s[^>]*href=/i.test(pageHtml(html));
}

function hasCanonical(html, canonical) {
  return html.includes('rel="canonical"') && html.includes(`href="${canonical}"`);
}

async function main() {
  const robots = await get('/robots.txt');
  assertStatus('/robots.txt', robots.response, 200);
  const robotsType = robots.response.headers.get('content-type') || '';
  if (!robotsType.includes('text/plain')) fail(`/robots.txt content-type was ${robotsType}`);
  if (!robots.text.includes(`Sitemap: ${SITE_ORIGIN}/sitemap.xml`)) fail('robots.txt missing sitemap line');
  if (/^Disallow: \/$/m.test(robots.text)) fail('robots.txt accidentally disallows /');

  const sitemap = await get('/sitemap.xml');
  assertStatus('/sitemap.xml', sitemap.response, 200);
  if (!sitemap.text.includes('<urlset')) fail('sitemap.xml is not valid urlset XML');

  for (const path of PUBLIC_PATHS) {
    const loc = path === '/' ? SITE_ORIGIN : `${SITE_ORIGIN}${path}`;
    if (!sitemap.text.includes(`<loc>${loc}</loc>`)) fail(`sitemap missing ${loc}`);
  }
  if (sitemap.text.includes(`${SITE_ORIGIN}/login`)) fail('sitemap includes /login');
  if (sitemap.text.includes(`${SITE_ORIGIN}/console`)) fail('sitemap includes /console');

  for (const path of PUBLIC_PATHS) {
    const page = await get(path, { redirect: 'follow' });
    assertStatus(path, page.response, 200);
    const html = page.text;
    if (!/<html lang="en-IN">/.test(html)) fail(`${path} missing html lang=en-IN`);
    if (!/<title>[^<]+<\/title>/.test(html)) fail(`${path} missing title`);
    if (!/<meta name="description" content="[^"]{50,}"/.test(html)) fail(`${path} missing or short description`);
    const canonical = path === '/' ? SITE_ORIGIN : `${SITE_ORIGIN}${path}`;
    if (!hasCanonical(html, canonical)) fail(`${path} missing canonical ${canonical}`);
    if (!html.includes('property="og:image"') && !html.includes('property="og:image:url"')) fail(`${path} missing og:image`);
    if (!html.includes('summary_large_image')) fail(`${path} missing twitter summary_large_image`);
    if (countH1(html) !== 1) fail(`${path} expected 1 H1, got ${countH1(html)}`);
    if (!html.includes('application/ld+json')) fail(`${path} missing JSON-LD`);
    if (!hasOutgoingLink(html)) fail(`${path} has no outgoing links`);
    if (/name="robots"[^>]+noindex/i.test(html)) fail(`${path} unexpectedly noindex`);
  }

  const og = await get(OG_IMAGE_PATH, { skipBody: true });
  assertStatus(OG_IMAGE_PATH, og.response, 200);
  const ogType = og.response.headers.get('content-type') || '';
  if (!ogType.includes('image/png')) fail(`OG image content-type was ${ogType}`);

  const favicon = await get('/favicon.svg', { skipBody: true });
  assertStatus('/favicon.svg', favicon.response, 200);
  const apple = await get('/apple-touch-icon.png', { skipBody: true });
  assertStatus('/apple-touch-icon.png', apple.response, 200);

  const missing = await get('/this-page-does-not-exist-seo-audit');
  if (missing.response.status !== 404) fail(`expected 404, got ${missing.response.status}`);
  if (countH1(missing.text) !== 1) fail('404 page missing H1');
  if (!hasOutgoingLink(missing.text)) fail('404 page has no outgoing links');

  const slash = await get('/pricing/', { skipBody: true });
  if (slash.response.status !== 301 && slash.response.status !== 308) {
    fail(`/pricing/ expected trailing-slash redirect, got ${slash.response.status}`);
  }

  const login = await get('/login');
  const loginRobots = login.response.headers.get('x-robots-tag') || '';
  if (!/noindex/i.test(login.text) && !/noindex/i.test(loginRobots)) {
    fail('/login should be noindex');
  }

  const blogPost = await get('/blog/agentic-testing-email-flows');
  assertStatus('/blog/agentic-testing-email-flows', blogPost.response, 200);
  if (!blogPost.text.includes('BlogPosting')) fail('blog post missing BlogPosting JSON-LD');
  if (countH1(blogPost.text) !== 1) fail('blog post expected 1 H1');
  if (!hasOutgoingLink(blogPost.text)) fail('blog post has no outgoing links');

  if (process.exitCode) {
    console.error(`SEO verification failed against ${origin}`);
    process.exit(process.exitCode);
  }
  console.log(`SEO verification passed against ${origin}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
