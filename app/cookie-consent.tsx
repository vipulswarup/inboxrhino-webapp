'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { GoogleAnalytics } from './google-analytics';

export const CONSENT_KEY = 'inboxrhino:analytics-consent:v1';
const MAX_AGE = 180 * 24 * 60 * 60 * 1000;

export function readConsent(): boolean | null {
  try {
    const saved = JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null');
    if (typeof saved?.accepted === 'boolean' && Number.isFinite(saved?.time) && Date.now() - saved.time >= 0 && Date.now() - saved.time < MAX_AGE) return saved.accepted;
  } catch { /* Storage can be unavailable; keep analytics disabled. */ }
  return null;
}

function clearAnalyticsCookies() {
  for (const cookie of document.cookie.split(';')) {
    const name = cookie.trim().split('=')[0];
    if (!/^_ga(?:_|$)|^_gid$|^_gat(?:_|$)/.test(name)) continue;
    for (const domain of ['', window.location.hostname, '.inboxrhino.in']) {
      document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax${domain ? `; Domain=${domain}` : ''}`;
    }
  }
}

export function CookieConsent() {
  const [accepted, setAccepted] = useState<boolean | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const sync = () => {
      const choice = readConsent();
      setAccepted(choice);
      setVisible(choice === null);
    };
    sync();
    window.addEventListener('storage', sync);
    const timer = window.setInterval(() => {
      if (readConsent() === null) { setAccepted(null); setVisible(true); }
    }, 60_000);
    return () => { window.removeEventListener('storage', sync); window.clearInterval(timer); };
  }, []);

  function choose(value: boolean) {
    try { localStorage.setItem(CONSENT_KEY, JSON.stringify({ accepted: value, time: Date.now() })); } catch { /* Keep the choice for this page session. */ }
    setAccepted(value);
    setVisible(false);
    if (!value) clearAnalyticsCookies();
  }

  return (
    <>
      <GoogleAnalytics consent={accepted === true} />
      <button type="button" onClick={() => setVisible(true)} className="fixed bottom-3 left-3 z-40 rounded-lg border border-stone-400 bg-white px-3 py-2 text-sm font-semibold text-stone-800 shadow-sm">Cookie settings</button>
      {visible ? (
        <section aria-label="Cookie preferences" className="fixed inset-x-3 bottom-16 z-50 mx-auto max-w-2xl rounded-xl border border-stone-300 bg-white p-5 text-stone-800 shadow-xl sm:bottom-16">
          <h2 className="text-lg font-bold">Your privacy choices</h2>
          <p className="mt-2 text-sm leading-6">We use essential storage for sign-in and your preferences. With your permission, Google Analytics measures visits to public pages. You can change your choice at any time. <Link href="/privacy" className="font-semibold text-[#0F3D3E] underline">Read our privacy policy</Link>.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={() => choose(false)} className="rounded-lg border border-[#0F3D3E] bg-white px-4 py-2 text-sm font-bold text-[#0F3D3E]">Reject optional cookies</button>
            <button type="button" onClick={() => choose(true)} className="rounded-lg border border-[#0F3D3E] bg-white px-4 py-2 text-sm font-bold text-[#0F3D3E]">Accept analytics</button>
          </div>
        </section>
      ) : null}
    </>
  );
}
