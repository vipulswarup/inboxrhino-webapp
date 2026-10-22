'use client';

import { useCallback, useEffect, useState } from 'react';

export const REVEALED_KEY_TTL_MS = 5 * 60 * 1000;

/** Holds a freshly created API secret just long enough to be copied, then forgets it. */
export function useRevealedApiKey(ttlMs = REVEALED_KEY_TTL_MS) {
  const [revealed, setRevealed] = useState<{ id: string; key: string } | null>(null);

  useEffect(() => {
    if (!revealed) return;
    const timer = window.setTimeout(() => setRevealed(null), ttlMs);
    return () => window.clearTimeout(timer);
  }, [revealed, ttlMs]);

  const reveal = useCallback((id: string, key: string) => setRevealed({ id, key }), []);
  const clear = useCallback(() => setRevealed(null), []);
  const clearIfRevoked = useCallback((id: string) => setRevealed((current) => (current?.id === id ? null : current)), []);

  return { revealedKey: revealed?.key ?? null, reveal, clear, clearIfRevoked };
}
