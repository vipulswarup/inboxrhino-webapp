import type { Metadata, MetadataRoute } from 'next';
import {
  CONTACT_EMAIL,
  ARGALI_ORIGIN,
  LEGAL_NAME,
  OFFICE_ADDRESS,
  OG_IMAGE_ALT,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_PATH,
  OG_IMAGE_WIDTH,
  SITE_ORIGIN,
} from './site';
import { OG_IMAGE_PAGES } from './og-images';

export type JsonLd = Record<string, unknown>;
export type Crumb = { name: string; path: string };
export type Faq = { q: string; a: string };

export const PUBLIC_PATHS = [
  '/',
  '/about',
  '/pricing',
  '/blog',
  '/docs',
  '/docs/quickstart',
  '/docs/api',
  '/docs/playwright',
  '/compare/tigrmail',
  '/compare/mailosaur',
  '/compare/mailhog',
  '/compare/mailslurp',
  '/compare/testmail',
  '/india',
  '/legal',
] as const;

// Sitemap <lastmod> per public page. Bump the date when a page's content
// materially changes; seo.test.ts fails if a public path is missing here.
export const PAGE_LAST_MODIFIED: Record<(typeof PUBLIC_PATHS)[number], string> = {
  '/': '2026-10-22',
  '/about': '2026-09-11',
  '/pricing': '2026-09-29',
  '/blog': '2026-10-22',
  '/docs': '2026-10-22',
  '/docs/quickstart': '2026-09-11',
  '/docs/api': '2026-09-15',
  '/docs/playwright': '2026-09-11',
  '/compare/tigrmail': '2026-10-22',
  '/compare/mailosaur': '2026-10-22',
  '/compare/mailhog': '2026-10-22',
  '/compare/mailslurp': '2026-10-22',
  '/compare/testmail': '2026-10-22',
  '/india': '2026-09-11',
  '/legal': '2026-09-29',
};

export const APP_ROBOTS_TXT = 'User-Agent: *\nDisallow: /\n';

type PageMetaOptions = {
  ogType?: 'website' | 'article';
  publishedTime?: string;
  robots?: Metadata['robots'];
};

export function absoluteUrl(path: string): string {
  if (!path || path === '/') return SITE_ORIGIN;
  return path.startsWith('http') ? path : `${SITE_ORIGIN}${path}`;
}

export function ogImagePath(path: string): string {
  return OG_IMAGE_PAGES.has(path) ? `/brand/og${path}.png` : OG_IMAGE_PATH;
}

export function pageMeta(path: string, title: string, description: string, options: PageMetaOptions = {}): Metadata {
  const url = absoluteUrl(path);
  const imagePath = ogImagePath(path);
  const imageUrl = absoluteUrl(imagePath);
  const ogType = options.ogType ?? 'website';
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    robots: options.robots,
    openGraph: {
      title,
      description,
      url,
      siteName: 'InboxRhino',
      type: ogType,
      locale: 'en_IN',
      images: [
        {
          url: imageUrl,
          width: OG_IMAGE_WIDTH,
          height: OG_IMAGE_HEIGHT,
          alt: imagePath === OG_IMAGE_PATH ? OG_IMAGE_ALT : title,
        },
      ],
      ...(ogType === 'article' && options.publishedTime ? { publishedTime: options.publishedTime } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export function organizationNode(): JsonLd {
  return {
    '@type': 'Organization',
    '@id': `${SITE_ORIGIN}/#organization`,
    name: LEGAL_NAME,
    legalName: LEGAL_NAME,
    url: ARGALI_ORIGIN,
    logo: absoluteUrl('/brand/logo-icon.svg'),
    email: CONTACT_EMAIL,
    address: {
      '@type': 'PostalAddress',
      ...OFFICE_ADDRESS,
    },
    brand: { '@id': `${SITE_ORIGIN}/#brand` },
  };
}

export function brandNode(): JsonLd {
  return {
    '@type': 'Brand',
    '@id': `${SITE_ORIGIN}/#brand`,
    name: 'InboxRhino',
    url: SITE_ORIGIN,
    logo: absoluteUrl('/brand/logo-icon.svg'),
  };
}

export function siteGraphJsonLd(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      organizationNode(),
      brandNode(),
      {
        '@type': 'WebSite',
        '@id': `${SITE_ORIGIN}/#website`,
        name: 'InboxRhino',
        url: SITE_ORIGIN,
        inLanguage: 'en-IN',
        publisher: { '@id': `${SITE_ORIGIN}/#organization` },
        about: { '@id': `${SITE_ORIGIN}/#brand` },
      },
    ],
  };
}

export function breadcrumbListJsonLd(items: Crumb[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function faqPageJsonLd(faqs: readonly Faq[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  };
}

export function softwareApplicationJsonLd(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'InboxRhino',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web',
    url: SITE_ORIGIN,
    description:
      'Receive-only test email API with real MX inboxes, wait-for-message, and a sandboxed HTML viewer for signup, OTP, and password-reset tests.',
    publisher: { '@id': `${SITE_ORIGIN}/#organization` },
    brand: { '@id': `${SITE_ORIGIN}/#brand` },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      url: absoluteUrl('/pricing'),
      description: 'Free tier: 11 active inboxes and 33 inbound emails per UTC month. Paid INR checkout is not open yet.',
    },
  };
}

export function blogPostingJsonLd(input: {
  path: string;
  title: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  author?: string;
}): JsonLd {
  const url = absoluteUrl(input.path);
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: input.title,
    description: input.description,
    image: absoluteUrl(ogImagePath(input.path)),
    datePublished: input.datePublished,
    dateModified: input.dateModified || input.datePublished,
    mainEntityOfPage: url,
    url,
    author: input.author
      ? { '@type': 'Person', name: input.author, worksFor: { '@id': `${SITE_ORIGIN}/#organization` } }
      : { '@id': `${SITE_ORIGIN}/#organization` },
    publisher: { '@id': `${SITE_ORIGIN}/#organization` },
  };
}

export function buildRobots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/console', '/login'],
    },
    sitemap: [`${SITE_ORIGIN}/sitemap.xml`, `${SITE_ORIGIN}/news/sitemap.xml`],
  };
}

export function buildSitemap(
  posts: { slug: string; date: string }[],
): MetadataRoute.Sitemap {
  const pages = PUBLIC_PATHS.map((path) => ({
    url: absoluteUrl(path),
    changeFrequency: path === '/' || path === '/blog' ? ('weekly' as const) : ('monthly' as const),
    priority: path === '/' ? 1 : path === '/docs' ? 0.8 : 0.7,
    lastModified: new Date(`${PAGE_LAST_MODIFIED[path]}T00:00:00Z`),
  }));

  const articles = posts.map((post) => ({
    url: absoluteUrl(`/blog/${post.slug}`),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
    lastModified: post.date ? new Date(`${post.date}T00:00:00Z`) : undefined,
  }));

  return [...pages, ...articles];
}

export function isAppHost(hostname: string): boolean {
  return hostname === 'app.inboxrhino.in' || hostname.endsWith('.chatgpt.site');
}

export function isNoindexPath(pathname: string): boolean {
  return (
    pathname === '/login' ||
    pathname.startsWith('/login/') ||
    pathname === '/console' ||
    pathname.startsWith('/console/') ||
    pathname === '/openapi.yaml' ||
    pathname.startsWith('/postman/')
  );
}

export function robotsHeaderValue(hostname: string, pathname: string): string | null {
  if (pathname === '/openapi.yaml' || pathname.startsWith('/postman/')) return 'noindex, follow';
  if (isAppHost(hostname) || isNoindexPath(pathname)) return 'noindex, nofollow';
  return null;
}

// Marketing pages read the Host header, so vinext marks them dynamic and sends
// `no-store`, which also disables the browser back/forward cache. They only
// change per deploy, so let browsers keep them and revalidate.
export const MARKETING_PAGE_CACHE_CONTROL = 'public, max-age=0, must-revalidate';

export function marketingCacheControl(hostname: string, pathname: string): string | null {
  if (hostname !== 'inboxrhino.in' && hostname !== 'localhost') return null;
  if (isNoindexPath(pathname) || pathname === '/news' || pathname.startsWith('/news/')) return null;
  if (isCacheablePublicAsset(pathname)) return null;
  return MARKETING_PAGE_CACHE_CONTROL;
}

export function isCacheablePublicAsset(pathname: string): boolean {
  return (
    pathname === OG_IMAGE_PATH ||
    pathname === '/favicon.svg' ||
    pathname === '/favicon.ico' ||
    pathname === '/apple-touch-icon.png' ||
    pathname === '/brand/logo-icon.svg' ||
    pathname === '/brand/logo-wordmark.svg' ||
    pathname === '/brand/logo-mark.svg'
  );
}
