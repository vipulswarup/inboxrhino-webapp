import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { consoleFetch, type ApiMessage } from './lib/console-api';
import { MAIL_REFRESH_MS, useMailboxes } from './use-mailboxes';

vi.mock('./lib/console-api', () => ({ consoleFetch: vi.fn() }));
const fetchConsole = vi.mocked(consoleFetch);
const getToken = vi.fn(async () => 'test-token');
const inboxes = ['a', 'b'].map((id) => ({ id, address: `${id}@example.com`, local_part: id, status: 'active', created_at: '2026-09-06T00:00:00Z' }));
const message = (id: string, inbox = 'a'): ApiMessage => ({ id, inbox_id: inbox, from: { name: 'Sender', address: 'sender@example.com' }, to: `${inbox}@example.com`, subject: id, preview: 'Preview', size_bytes: 42, received_at: '2026-09-06T00:00:00Z', expires_at: '2026-10-06T00:00:00Z', internet_message_id: null, text: 'Actual email', html: null, headers: [], attachments: [] });
function mockApi() {
  fetchConsole.mockImplementation(async (path) => {
    if (path.startsWith('/console/inboxes?')) return { data: inboxes };
    if (path.includes('/inboxes/a/messages')) return { data: [message('a1'), message('a2')] };
    if (path.includes('/inboxes/b/messages')) return { data: [message('b1', 'b')] };
    return { data: message(path.split('/').at(-1)!) };
  });
}
afterEach(() => { cleanup(); vi.resetAllMocks(); vi.useRealTimers(); });

describe('live mailbox data', () => {
  it('loads summaries first and retrieves only the selected email', async () => {
    mockApi();
    const { result } = renderHook(() => useMailboxes(getToken, true));
    await waitFor(() => expect(result.current.detail?.id).toBe('a1'));
    expect(result.current.messages).toHaveLength(2);
    expect(fetchConsole.mock.calls.some(([path]) => path === '/console/messages/a2')).toBe(false);
    act(() => result.current.selectMessage('a2'));
    await waitFor(() => expect(result.current.detail?.id).toBe('a2'));
  });

  it('preserves the selected mailbox on refresh and ignores late previous-mailbox responses', async () => {
    mockApi();
    const { result } = renderHook(() => useMailboxes(getToken, true));
    await waitFor(() => expect(result.current.detail?.id).toBe('a1'));
    let resolveOld!: (data: unknown) => void;
    fetchConsole.mockImplementation(async (path) => {
      if (path.startsWith('/console/inboxes?')) return { data: inboxes };
      if (path.includes('/inboxes/a/messages')) return new Promise((resolve) => { resolveOld = resolve; });
      if (path.includes('/inboxes/b/messages')) return { data: [message('b1', 'b')] };
      return { data: message('b1', 'b') };
    });
    act(() => result.current.refresh());
    await waitFor(() => expect(resolveOld).toBeDefined());
    act(() => result.current.selectInbox('b'));
    await waitFor(() => expect(result.current.detail?.id).toBe('b1'));
    await act(async () => resolveOld({ data: [message('wrong')] }));
    expect(result.current.messages[0]?.id).toBe('b1');
    act(() => result.current.refresh());
    await waitFor(() => expect(result.current.refreshing).toBe(false));
    expect(result.current.activeInbox?.id).toBe('b');
    expect(result.current.messages[0]?.id).toBe('b1');
  });

  it('keeps summaries available if one email fails and supports retry', async () => {
    mockApi();
    const normal = fetchConsole.getMockImplementation()!;
    fetchConsole.mockImplementation(async (path, ...rest) => {
      if (path === '/console/messages/a1') throw new Error('Email unavailable');
      return normal(path, ...rest);
    });
    const { result } = renderHook(() => useMailboxes(getToken, true));
    await waitFor(() => expect(result.current.detailError).toBe('Email unavailable'));
    expect(result.current.messages).toHaveLength(2);
    mockApi();
    act(() => result.current.refresh());
    await waitFor(() => expect(result.current.detail?.id).toBe('a1'));
    expect(result.current.detailError).toBe('');
  });

  it('polls for new messages without a page reload', async () => {
    mockApi();
    const { result } = renderHook(() => useMailboxes(getToken, true));
    await waitFor(() => expect(result.current.detail?.id).toBe('a1'));
    vi.useFakeTimers();
    // The focus event exercises the same refresh path; remount installs a fake timer.
    cleanup();
    const live = renderHook(() => useMailboxes(getToken, true));
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    const normal = fetchConsole.getMockImplementation()!;
    fetchConsole.mockImplementation(async (path, ...rest) => path.includes('/inboxes/a/messages') ? { data: [message('new'), message('a1')] } : normal(path, ...rest));
    await act(async () => { await vi.advanceTimersByTimeAsync(MAIL_REFRESH_MS); });
    expect(live.result.current.messages[0]?.id).toBe('new');
  });

  it('does not request protected mailboxes for an unverified account', () => {
    renderHook(() => useMailboxes(getToken, false));
    expect(fetchConsole).not.toHaveBeenCalled();
  });
});
