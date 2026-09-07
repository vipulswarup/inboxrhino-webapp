import type { Metadata, MetadataRoute } from 'next';
import {
  CONTACT_EMAIL,
  LEGAL_NAME,
  OFFICE_ADDRESS,
  OG_IMAGE_ALT,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_PATH,
  OG_IMAGE_WIDTH,
  SAME_AS,
  SITE_ORIGIN,
} from './site';

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
  '/india',
  '/legal',
] as const;

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

export function pageMeta(path: string, title: string, description: string, options: PageMetaOptions = {}): Metadata {
  const url = absoluteUrl(path);
  const imageUrl = absoluteUrl(OG_IMAGE_PATH);
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
          alt: OG_IMAGE_ALT,
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
    name: 'InboxRhino',
    legalName: LEGAL_NAME,
    url: SITE_ORIGIN,
    logo: absoluteUrl('/brand/logo-icon.svg'),
    email: CONTACT_EMAIL,
    address: {
      '@type': 'PostalAddress',
      ...OFFICE_ADDRESS,
    },
    sameAs: [...SAME_AS],
  };
}

export function siteGraphJsonLd(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      organizationNode(),
      {
        '@type': 'WebSite',
        '@id': `${SITE_ORIGIN}/#website`,
        name: 'InboxRhino',
        url: SITE_ORIGIN,
        inLanguage: 'en-IN',
        publisher: { '@id': `${SITE_ORIGIN}/#organization` },
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
}): JsonLd {
  const url = absoluteUrl(input.path);
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: input.title,
    description: input.description,
    image: absoluteUrl(OG_IMAGE_PATH),
    datePublished: input.datePublished,
    dateModified: input.dateModified || input.datePublished,
    mainEntityOfPage: url,
    url,
    author: { '@id': `${SITE_ORIGIN}/#organization` },
    publisher: { '@id': `${SITE_ORIGIN}/#organization` },
  };
}

export function buildRobots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/compare/', OG_IMAGE_PATH, '/brand/logo-icon.svg'],
      disallow: ['/console', '/login', '/openapi.yaml', '/postman/', '/brand/'],
    },
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
    host: SITE_ORIGIN.replace(/^https:\/\//, ''),
  };
}

export function buildSitemap(
  posts: { slug: string; date: string }[],
): MetadataRoute.Sitemap {
  const pages = PUBLIC_PATHS.map((path) => ({
    url: absoluteUrl(path),
    changeFrequency: path === '/' || path === '/blog' ? ('weekly' as const) : ('monthly' as const),
    priority: path === '/' ? 1 : path === '/docs' ? 0.8 : 0.7,
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

export function shouldNoindexAsset(pathname: string): boolean {
  if (pathname === OG_IMAGE_PATH || pathname === '/brand/logo-icon.svg') return false;
  return pathname.startsWith('/brand/');
}

export function isCacheablePublicAsset(pathname: string): boolean {
  return (
    pathname === OG_IMAGE_PATH ||
    pathname === '/favicon.svg' ||
    pathname === '/apple-touch-icon.png' ||
    pathname === '/brand/logo-icon.svg' ||
    pathname === '/brand/logo-wordmark.svg' ||
    pathname === '/brand/logo-mark.svg'
  );
}
