'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useSyncExternalStore } from 'react';
import { GA_MEASUREMENT_ID, isPublicAnalyticsHost } from './lib/site';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const subscribe = () => () => {};
const publicHostSnapshot = () => isPublicAnalyticsHost(window.location.hostname);
const serverSnapshot = () => false;

export function GoogleAnalytics({ consent }: { consent: boolean }) {
  const pathname = usePathname();
  const publicHost = useSyncExternalStore(subscribe, publicHostSnapshot, serverSnapshot);
  const publicPath = pathname !== '/login' && pathname !== '/console' && !pathname.startsWith('/console/');
  const enabled = consent && publicHost && publicPath;

  useEffect(() => {
    // Disabling the property stops an already-loaded gtag after withdrawal.
    Object.assign(window, { [`ga-disable-${GA_MEASUREMENT_ID}`]: !enabled });
    if (!enabled || !GA_MEASUREMENT_ID) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || ((...args: unknown[]) => window.dataLayer?.push(args));
    window.gtag('js', new Date());
    window.gtag('consent', 'update', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    window.gtag('config', GA_MEASUREMENT_ID, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      // Never forward search parameters, fragments, or console content.
      page_location: `${window.location.origin}${pathname}`,
      page_referrer: '',
    });
    window.gtag('event', 'page_view', { page_location: `${window.location.origin}${pathname}`, page_referrer: '', page_title: document.title });
    return () => { Object.assign(window, { [`ga-disable-${GA_MEASUREMENT_ID}`]: true }); };
  }, [enabled, pathname]);

  if (!enabled || !GA_MEASUREMENT_ID) return null;
  return <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />;
}
