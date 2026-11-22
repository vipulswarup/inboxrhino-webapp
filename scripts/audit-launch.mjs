#!/usr/bin/env node
// Read-only audit against a running local production build or deployed site.
import { JSDOM } from 'jsdom';
import { gzipSync } from 'node:zlib';

const origin = new URL(process.env.AUDIT_ORIGIN || 'http://localhost:3000');
const sitemap = await fetch(new URL('/sitemap.xml', origin)).then(r => r.text());
const pages = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => new URL(m[1]).pathname);
if (!pages.length) throw new Error('Sitemap contains no pages');
const failures = [];
const links = new Set();
const externalLinks = new Set();
const timings = [];
for (const path of pages) {
  const start = performance.now();
  const response = await fetch(new URL(path, origin));
  const html = await response.text();
  timings.push({ path, ms: Math.round(performance.now() - start), gzipBytes: gzipSync(html).length });
  if (response.status !== 200) failures.push(`${path}: HTTP ${response.status}`);
  const dom = new JSDOM(html, { url: new URL(path, origin).href });
  const doc = dom.window.document;
  if (!doc.title || !doc.querySelector('meta[name="description"]')?.content) failures.push(`${path}: missing title/description`);
  for (const img of doc.images) if (!img.hasAttribute('alt')) failures.push(`${path}: image missing alt (${img.src})`);
  for (const a of doc.querySelectorAll('a[href]')) {
    const url = new URL(a.href);
    if (url.origin === origin.origin || url.origin === 'https://inboxrhino.in') {
      if (url.pathname !== path) links.add(url.pathname);
      else if (url.hash && !doc.getElementById(decodeURIComponent(url.hash.slice(1)))) failures.push(`${path}: missing anchor ${url.hash}`);
    } else if (url.protocol === 'https:') externalLinks.add(url.href);
  }
  if ([...doc.scripts].some(s => /googletagmanager|analytics.ahrefs/.test(s.src))) failures.push(`${path}: tracking script in initial HTML`);
  dom.window.close();
}
const checked = [];
for (const path of links) {
  const response = await fetch(new URL(path, origin), { redirect: 'follow' });
  if (!response.ok) failures.push(`Link ${path}: HTTP ${response.status}`);
  checked.push({ path, status: response.status });
  await response.body?.cancel();
}
const external = [];
if (process.env.AUDIT_EXTERNAL === '1') {
  const urls = [...externalLinks];
  for (let i = 0; i < urls.length; i += 4) {
    external.push(...await Promise.all(urls.slice(i, i + 4).map(async url => {
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(15000), redirect: 'follow' });
        await response.body?.cancel();
        if (response.status === 404 || response.status === 410) failures.push(`External link ${url}: HTTP ${response.status}`);
        return { url, status: response.status };
      } catch { return { url, status: 'unverified (timeout or network restriction)' }; }
    })));
  }
}
const missing = await fetch(new URL('/launch-audit-missing-page', origin));
if (missing.status !== 404) failures.push(`Missing page: expected 404, got ${missing.status}`);
console.log(JSON.stringify({ origin: origin.origin, pages: pages.length, links: checked, external, timings, failures }, null, 2));
if (failures.length) process.exitCode = 1;
