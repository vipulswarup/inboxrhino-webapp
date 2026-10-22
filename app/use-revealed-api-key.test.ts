import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { REVEALED_KEY_TTL_MS, useRevealedApiKey } from './use-revealed-api-key';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('useRevealedApiKey', () => {
  it('forgets the key when that key is revoked, but not when another key is', () => {
    const { result } = renderHook(() => useRevealedApiKey());
    act(() => result.current.reveal('key_1', 'ir_live_secret'));
    act(() => result.current.clearIfRevoked('key_other'));
    expect(result.current.revealedKey).toBe('ir_live_secret');
    act(() => result.current.clearIfRevoked('key_1'));
    expect(result.current.revealedKey).toBeNull();
  });

  it('clears when dismissed', () => {
    const { result } = renderHook(() => useRevealedApiKey());
    act(() => result.current.reveal('key_1', 'ir_live_secret'));
    act(() => result.current.clear());
    expect(result.current.revealedKey).toBeNull();
  });

  it('hides the key after five minutes', () => {
    const { result } = renderHook(() => useRevealedApiKey());
    act(() => result.current.reveal('key_1', 'ir_live_secret'));
    act(() => { vi.advanceTimersByTime(REVEALED_KEY_TTL_MS - 1000); });
    expect(result.current.revealedKey).toBe('ir_live_secret');
    act(() => { vi.advanceTimersByTime(1000); });
    expect(result.current.revealedKey).toBeNull();
  });

  it('restarts the timer when a new key is created', () => {
    const { result } = renderHook(() => useRevealedApiKey());
    act(() => result.current.reveal('key_1', 'first'));
    act(() => { vi.advanceTimersByTime(REVEALED_KEY_TTL_MS - 1000); });
    act(() => result.current.reveal('key_2', 'second'));
    act(() => { vi.advanceTimersByTime(2000); });
    expect(result.current.revealedKey).toBe('second');
  });
});
