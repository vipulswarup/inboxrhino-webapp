'use client';

import { useEffect, useRef, useState } from 'react';
import { turnstileSiteKey } from './lib/console-api';

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: { sitekey: string; callback: (token: string) => void; 'expired-callback'?: () => void }) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

type TurnstileWidgetProps = {
  onToken: (token: string) => void;
  onExpire?: () => void;
};

export function TurnstileWidget({ onToken, onExpire }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  const onExpireRef = useRef(onExpire);
  const [ready, setReady] = useState(
    () => typeof document !== 'undefined' && Boolean(document.querySelector('script[data-turnstile="true"]')),
  );

  useEffect(() => {
    onTokenRef.current = onToken;
    onExpireRef.current = onExpire;
  });

  useEffect(() => {
    if (ready) return;
    const existing = document.querySelector('script[data-turnstile="true"]');
    if (existing) {
      const timeout = window.setTimeout(() => setReady(true), 0);
      return () => window.clearTimeout(timeout);
    }
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.dataset.turnstile = 'true';
    script.onload = () => setReady(true);
    document.head.appendChild(script);
  }, [ready]);

  useEffect(() => {
    if (!ready || !containerRef.current || !window.turnstile) return;
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: turnstileSiteKey,
      callback: (token) => onTokenRef.current(token),
      'expired-callback': () => onExpireRef.current?.(),
    });
    return () => {
      if (widgetIdRef.current && window.turnstile) window.turnstile.remove(widgetIdRef.current);
      widgetIdRef.current = null;
    };
  }, [ready]);

  return <div ref={containerRef} className="min-h-[65px]" />;
}
