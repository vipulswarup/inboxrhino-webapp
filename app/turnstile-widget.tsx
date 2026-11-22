'use client';

import { useEffect, useRef, useState } from 'react';
import { turnstileSiteKey } from './lib/console-api';

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: { sitekey: string; action: string; size: 'flexible'; callback: (token: string) => void; 'expired-callback'?: () => void; 'error-callback'?: () => void }) => string;
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
    () => typeof window !== 'undefined' && Boolean(window.turnstile),
  );

  useEffect(() => {
    onTokenRef.current = onToken;
    onExpireRef.current = onExpire;
  });

  useEffect(() => {
    if (ready) return;
    const existing = document.querySelector<HTMLScriptElement>('script[data-turnstile="true"]');
    const script = existing ?? document.createElement('script');
    const loaded = () => setReady(true);
    script.addEventListener('load', loaded);
    if (!existing) {
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.dataset.turnstile = 'true';
      document.head.appendChild(script);
    }
    return () => script.removeEventListener('load', loaded);
  }, [ready]);

  useEffect(() => {
    if (!ready || !containerRef.current || !window.turnstile || !turnstileSiteKey) return;
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: turnstileSiteKey,
      action: 'signup',
      size: 'flexible',
      callback: (token) => onTokenRef.current(token),
      'expired-callback': () => onExpireRef.current?.(),
      'error-callback': () => onExpireRef.current?.(),
    });
    return () => {
      if (widgetIdRef.current && window.turnstile) window.turnstile.remove(widgetIdRef.current);
      widgetIdRef.current = null;
    };
  }, [ready]);

  if (!turnstileSiteKey) return <p role="alert" className="text-sm text-red-700">Verification is unavailable. Please contact contact@inboxrhino.in.</p>;
  return <div ref={containerRef} className="min-h-[65px]" />;
}
