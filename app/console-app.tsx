'use client';

import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { useAuth } from './auth-provider';
import {
  consoleFetch,
  downloadAttachment,
  type ApiInbox,
  type ApiKeySummary,
  type ApiMessage,
  type ApiMessageSummary,
  type UsageResponse,
} from './lib/console-api';
import { MessageViewer, type Message } from './message-viewer';
import { useMailboxes } from './use-mailboxes';

type Panel = 'inboxes' | 'api-keys' | 'usage';

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function mapApiMessage(message: ApiMessageSummary, content?: ApiMessage): Message {
  const received = new Date(message.received_at);
  return {
    id: message.id,
    senderName: message.from.name || message.from.address,
    senderEmail: message.from.address,
    recipient: message.to,
    subject: message.subject || '(no subject)',
    preview: message.preview,
    receivedAt: received.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    dateLabel: received.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }),
    unread: false,
    html: content?.html ?? '',
    text: content?.text ?? '',
    headers: content?.headers ?? [],
    contentLoaded: !!content,
    attachments: (content?.attachments ?? []).map((attachment) => ({
      id: attachment.id,
      name: attachment.filename,
      size: formatBytes(attachment.size_bytes),
      type: attachment.content_type.split('/').at(-1)?.toUpperCase() ?? 'FILE',
    })),
  };
}

export function ConsoleApp() {
  const auth = useAuth();
  const [panel, setPanel] = useState<Panel>('inboxes');
  const mailbox = useMailboxes(auth.getIdToken, auth.session?.user.email_verified ?? false);
  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKeySummary[]>([]);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [accountOpen, setAccountOpen] = useState(false);
  const { activeInbox } = mailbox;
  const messages = mailbox.messages.map((message) => mapApiMessage(message, mailbox.detail?.id === message.id ? mailbox.detail : undefined));
  const getToken = auth.getIdToken;
  const isOwner = auth.session?.role === 'owner';
  const verified = auth.session?.user.email_verified ?? false;

  const loadUsage = useCallback(async () => {
    if (!verified) return;
    const token = await getToken();
    const payload = await consoleFetch<UsageResponse>('/console/usage', token);
    setUsage(payload);
  }, [getToken, verified]);

  const loadApiKeys = useCallback(async () => {
    if (!isOwner) return;
    const token = await getToken();
    const payload = await consoleFetch<{ data: ApiKeySummary[] }>('/console/api-keys', token);
    setApiKeys(payload.data);
  }, [getToken, isOwner]);

  const reportError = (caught: unknown) => setError(caught instanceof Error ? caught.message : 'The action could not be completed.');
  const runAction = (action: () => Promise<unknown>) => { setError(''); void action().catch(reportError); };
  const refresh = () => { mailbox.refresh(); runAction(loadUsage); };

  useEffect(() => {
    const initial = window.setTimeout(() => {
      void loadUsage().catch(reportError);
      void loadApiKeys().catch(reportError);
    }, 0);
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'hidden') void loadUsage().catch(reportError);
    }, 15000);
    return () => { window.clearTimeout(initial); window.clearInterval(timer); };
  }, [loadApiKeys, loadUsage]);

  const createInbox = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const prefix = String(form.get('prefix') ?? '').trim();
    try {
      const token = await auth.getIdToken();
      const payload = await consoleFetch<{ data: ApiInbox }>(
        '/console/inboxes',
        token,
        { method: 'POST', body: JSON.stringify(prefix ? { prefix } : {}) },
      );
      mailbox.addInbox(payload.data);
      void loadUsage().catch(reportError);
      setError('');
      formElement.reset();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The inbox could not be created.');
    }
  };

  const deleteInbox = async (inboxId: string) => {
    const token = await auth.getIdToken();
    await consoleFetch<null>(`/console/inboxes/${inboxId}`, token, { method: 'DELETE' });
    mailbox.removeInbox(inboxId);
    await loadUsage();
  };

  const deleteMessage = async (messageId: string) => {
    const token = await auth.getIdToken();
    await consoleFetch<null>(`/console/messages/${messageId}`, token, { method: 'DELETE' });
    mailbox.removeMessage(messageId);
  };

  const createApiKey = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const name = String(form.get('name') ?? 'Console API key').trim();
    try {
      const token = await auth.getSensitiveActionToken();
      const payload = await consoleFetch<{ data: ApiKeySummary & { api_key: string } }>(
        '/console/api-keys',
        token,
        { method: 'POST', body: JSON.stringify({ name }) },
      );
      setNewApiKey(payload.data.api_key);
      setError('');
      await loadApiKeys();
      formElement.reset();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The API key could not be created.');
    }
  };

  const revokeApiKey = async (keyId: string) => {
    try {
      const token = await auth.getSensitiveActionToken();
      await consoleFetch<null>(`/console/api-keys/${keyId}`, token, { method: 'DELETE' });
      setError('');
      await loadApiKeys();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The API key could not be revoked.');
    }
  };

  const initials = auth.session?.user.email.slice(0, 2).toUpperCase() ?? 'IR';

  return (
    <MessageViewer
      mode="live"
      displayMessages={messages}
      activeInbox={
        activeInbox
          ? { id: activeInbox.id, address: activeInbox.address, local_part: activeInbox.local_part }
          : { id: 'none', address: 'Create an inbox to begin', local_part: 'empty' }
      }
      usage={usage ? { received: usage.emails.received, limit: usage.emails.limit, inboxes: usage.inboxes.active, inboxLimit: usage.inboxes.limit } : undefined}
      verified={auth.session?.user.email_verified ?? false}
      panel={panel}
      onPanelChange={setPanel}
      error={error || mailbox.error}
      loading={mailbox.loading}
      messagesLoading={mailbox.messagesLoading}
      refreshing={mailbox.refreshing}
      lastUpdated={mailbox.lastUpdated?.toLocaleTimeString()}
      onRefresh={refresh}
      selectedMessageId={mailbox.selectedMessageId}
      onSelectMessage={mailbox.selectMessage}
      detailError={mailbox.detailError}
      onRetryMessage={mailbox.refresh}
      onRefreshVerification={() => runAction(auth.refreshSession)}
      accountLabel={initials}
      accountOpen={accountOpen}
      onAccountToggle={() => setAccountOpen((open) => !open)}
      onSignOut={() => void auth.signOutUser()}
      onResendVerification={() => runAction(auth.resendVerification)}
      onCreateInbox={createInbox}
      onDeleteInbox={() => activeInbox && runAction(() => deleteInbox(activeInbox.id))}
      onDeleteMessage={(messageId) => runAction(() => deleteMessage(messageId))}
      onDownloadAttachment={(attachmentId, filename) => runAction(() => auth.getIdToken().then((token) => downloadAttachment(attachmentId, token, filename)))}
      apiKeys={apiKeys}
      newApiKey={newApiKey}
      onCreateApiKey={isOwner ? createApiKey : undefined}
      onRevokeApiKey={(keyId) => void revokeApiKey(keyId)}
      onSelectInbox={mailbox.selectInbox}
      inboxes={mailbox.inboxes}
    />
  );
}
