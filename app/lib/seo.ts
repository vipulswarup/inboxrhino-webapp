import type { Metadata } from 'next';
import { SITE_ORIGIN } from './site';

export function pageMeta(path: string, title: string, description: string): Metadata {
  const url = path === '/' ? SITE_ORIGIN : `${SITE_ORIGIN}${path}`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: 'InboxRhino',
      type: 'website',
      locale: 'en_IN',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}
