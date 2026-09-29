'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { consoleFetch, type ApiInbox, type ApiMessage, type ApiMessageSummary } from './lib/console-api';

export const MAIL_REFRESH_MS = 5000;

/** Scope every response to its mailbox and abort superseded requests. */
export function useMailboxes(getToken: () => Promise<string>, enabled: boolean) {
  const [inboxes, setInboxes] = useState<ApiInbox[]>([]);
  const [inboxId, setInboxId] = useState<string | null>(null);
  const [messageId, setMessageId] = useState<string | null>(null);
  const [list, setList] = useState<{ inboxId: string; data: ApiMessageSummary[] } | null>(null);
  const [detail, setDetail] = useState<ApiMessage | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [retryKey, setRetryKey] = useState(0);
  const [inboxesLoading, setInboxesLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [inboxError, setInboxError] = useState('');
  const [listError, setListError] = useState('');
  const [detailError, setDetailError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [nextInboxOffset, setNextInboxOffset] = useState<number | null>(null);
  const [nextMessageOffset, setNextMessageOffset] = useState<number | null>(null);
  const expandedInboxes = useRef(false);
  const expandedMessages = useRef(false);
  const activeInbox = inboxes.find((inbox) => inbox.id === inboxId) ?? inboxes[0] ?? null;
  const activeInboxId = activeInbox?.id;
  const messages = activeInboxId && list?.inboxId === activeInboxId ? list.data : [];
  const selectedMessageId = messages.find((message) => message.id === messageId)?.id ?? messages[0]?.id ?? null;

  const refresh = useCallback(() => {
    setRefreshKey((key) => key + 1);
    setRetryKey((key) => key + 1);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'hidden') setRefreshKey((key) => key + 1);
    }, MAIL_REFRESH_MS);
    const onFocus = () => setRefreshKey((key) => key + 1);
    window.addEventListener('focus', onFocus);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', onFocus); };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    const load = async () => {
      setInboxesLoading(true);
      try {
        const token = await getToken();
        const payload = await consoleFetch<{ data: ApiInbox[]; next_offset: number | null }>('/console/inboxes?limit=100', token, { signal: controller.signal });
        if (controller.signal.aborted) return;
        setInboxes((previous) => !expandedInboxes.current ? payload.data : [...payload.data, ...previous.filter((item) => !payload.data.some((fresh) => fresh.id === item.id))]);
        if (!expandedInboxes.current) setNextInboxOffset(payload.next_offset);
        setInboxError('');
      } catch (error) {
        if (!controller.signal.aborted) setInboxError(error instanceof Error ? error.message : 'Mailboxes could not be loaded.');
      } finally {
        if (!controller.signal.aborted) setInboxesLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [enabled, getToken, refreshKey]);

  useEffect(() => {
    if (!enabled || !activeInboxId) return;
    const controller = new AbortController();
    const load = async () => {
      setMessagesLoading(true);
      try {
        const token = await getToken();
        const payload = await consoleFetch<{ data: ApiMessageSummary[]; next_offset: number | null }>(`/console/inboxes/${activeInboxId}/messages?limit=100`, token, { signal: controller.signal });
        if (controller.signal.aborted) return;
        setList((previous) => previous?.inboxId === activeInboxId && expandedMessages.current
          ? { inboxId: activeInboxId, data: [...payload.data, ...previous.data.filter((item) => !payload.data.some((fresh) => fresh.id === item.id))] }
          : { inboxId: activeInboxId, data: payload.data });
        if (!expandedMessages.current) setNextMessageOffset(payload.next_offset);
        setListError('');
        setLastUpdated(new Date());
      } catch (error) {
        if (!controller.signal.aborted) setListError(error instanceof Error ? error.message : 'Messages could not be loaded.');
      } finally {
        if (!controller.signal.aborted) setMessagesLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [enabled, getToken, activeInboxId, refreshKey]);

  useEffect(() => {
    if (!enabled || !selectedMessageId) return;
    const controller = new AbortController();
    const load = async () => {
      setDetailError('');
      try {
        const token = await getToken();
        const payload = await consoleFetch<{ data: ApiMessage }>(`/console/messages/${selectedMessageId}`, token, { signal: controller.signal });
        if (!controller.signal.aborted) setDetail(payload.data);
      } catch (error) {
        if (!controller.signal.aborted) setDetailError(error instanceof Error ? error.message : 'This email could not be loaded.');
      }
    };
    void load();
    return () => controller.abort();
  }, [enabled, getToken, selectedMessageId, retryKey]);

  const loadMoreInboxes = async () => {
    if (nextInboxOffset === null) return;
    expandedInboxes.current = true;
    const token = await getToken();
    const payload = await consoleFetch<{ data: ApiInbox[]; next_offset: number | null }>(`/console/inboxes?limit=100&offset=${nextInboxOffset}`, token);
    setInboxes((previous) => [...previous, ...payload.data.filter((item) => !previous.some((existing) => existing.id === item.id))]);
    setNextInboxOffset(payload.next_offset);
  };
  const loadMoreMessages = async () => {
    if (nextMessageOffset === null || !activeInboxId) return;
    expandedMessages.current = true;
    const token = await getToken();
    const inboxId = activeInboxId;
    const payload = await consoleFetch<{ data: ApiMessageSummary[]; next_offset: number | null }>(`/console/inboxes/${inboxId}/messages?limit=100&offset=${nextMessageOffset}`, token);
    setList((previous) => previous?.inboxId === inboxId ? { inboxId, data: [...previous.data, ...payload.data.filter((item) => !previous.data.some((existing) => existing.id === item.id))] } : previous);
    setNextMessageOffset(payload.next_offset);
  };

  const selectInbox = (id: string) => { setInboxId(id); setMessageId(null); setNextMessageOffset(null); expandedMessages.current = false; };
  const removeMessage = (id: string) => {
    setList((current) => current ? { ...current, data: current.data.filter((message) => message.id !== id) } : null);
    refresh();
  };
  const removeInbox = (id: string) => { setInboxes((current) => current.filter((inbox) => inbox.id !== id)); refresh(); };
  const addInbox = (inbox: ApiInbox) => { setInboxes((current) => [inbox, ...current]); selectInbox(inbox.id); refresh(); };

  return {
    inboxes, activeInbox, messages, selectedMessageId,
    hasMoreInboxes: nextInboxOffset !== null, hasMoreMessages: nextMessageOffset !== null, loadMoreInboxes, loadMoreMessages,
    detail: detail?.id === selectedMessageId ? detail : null,
    detailError, error: inboxError || listError,
    loading: enabled && inboxesLoading && !inboxes.length,
    refreshing: enabled && (inboxesLoading || messagesLoading),
    messagesLoading: enabled && !!activeInboxId && (list?.inboxId !== activeInboxId || messagesLoading),
    lastUpdated, refresh, selectInbox, selectMessage: setMessageId,
    removeMessage, removeInbox, addInbox,
  };
}
