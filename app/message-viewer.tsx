'use client';

import { type FormEvent, useState } from 'react';
import { messages, type Message } from './message-demo-data';
import { MessageViewerUI, type ApiInbox, type ApiKeySummary, type Panel, type Tab } from './message-viewer-ui';

export { createSafeEmailDocument, emailPreviewCsp, messages, type Message } from './message-demo-data';

export type MessageViewerProps = {
  mode?: 'demo' | 'live';
  loading?: boolean;
  messagesLoading?: boolean;
  refreshing?: boolean;
  lastUpdated?: string;
  onRefresh?: () => void;
  selectedMessageId?: string | null;
  onSelectMessage?: (id: string) => void;
  detailError?: string;
  onRetryMessage?: () => void;
  onRefreshVerification?: () => void;
  displayMessages?: Message[];
  activeInbox?: ApiInbox;
  inboxes?: ApiInbox[];
  usage?: { received: number; limit: number; inboxes?: number; inboxLimit?: number };
  verified?: boolean;
  panel?: Panel;
  onPanelChange?: (panel: Panel) => void;
  error?: string;
  accountLabel?: string;
  accountOpen?: boolean;
  onAccountToggle?: () => void;
  onSignOut?: () => void;
  onResendVerification?: () => void;
  onCreateInbox?: (event: FormEvent<HTMLFormElement>) => void;
  onDeleteInbox?: () => void;
  onDeleteMessage?: (messageId: string) => void;
  onDownloadAttachment?: (attachmentId: string, filename: string) => void;
  apiKeys?: ApiKeySummary[];
  newApiKey?: string | null;
  onCreateApiKey?: (event: FormEvent<HTMLFormElement>) => void;
  onRevokeApiKey?: (keyId: string) => void;
  onSelectInbox?: (inboxId: string) => void;
  embed?: boolean;
};

export function MessageViewer(props: MessageViewerProps = {}) {
  const isLive = props.mode === 'live';
  const displayMessages = props.displayMessages ?? (isLive ? [] : messages);
  const activeInbox = props.activeInbox ?? (isLive ? { id: 'none', address: 'Create a mailbox to begin', local_part: 'No mailbox selected' } : {
    id: 'demo',
    address: messages[0].recipient,
    local_part: messages[0].recipient.split('@')[0],
  });
  const usage = props.usage ?? { received: 0, limit: 33, inboxes: 0, inboxLimit: 11 };
  const panel = props.panel ?? 'inboxes';
  const [activeId, setActiveId] = useState(displayMessages[0]?.id);
  const [activeTab, setActiveTab] = useState<Tab>('html');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const selectedId = props.selectedMessageId !== undefined ? props.selectedMessageId : activeId;
  const resolvedActiveId = displayMessages.some((message) => message.id === selectedId)
    ? selectedId
    : displayMessages[0]?.id;
  const activeMessage = displayMessages.find((message) => message.id === resolvedActiveId);

  const selectMessage = (messageId: string) => {
    setActiveId(messageId);
    props.onSelectMessage?.(messageId);
    setActiveTab('html');
    setDetailsOpen(false);
  };

  const copyAddress = async () => {
    await navigator.clipboard?.writeText(activeInbox.address);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <MessageViewerUI
      embed={props.embed}
      isLive={isLive}
      displayMessages={displayMessages}
      activeInbox={activeInbox}
      usage={usage}
      panel={panel}
      activeMessage={activeMessage}
      activeTab={activeTab}
      detailsOpen={detailsOpen}
      copied={copied}
      verified={props.verified}
      error={props.error}
      accountLabel={props.accountLabel}
      accountOpen={props.accountOpen}
      loading={props.loading}
      messagesLoading={props.messagesLoading}
      refreshing={props.refreshing}
      lastUpdated={props.lastUpdated}
      detailError={props.detailError}
      inboxes={props.inboxes}
      apiKeys={props.apiKeys}
      newApiKey={props.newApiKey}
      onAccountToggle={props.onAccountToggle}
      onSignOut={props.onSignOut}
      onResendVerification={props.onResendVerification}
      onRefreshVerification={props.onRefreshVerification}
      onPanelChange={props.onPanelChange}
      onDeleteInbox={props.onDeleteInbox}
      onCopyAddress={copyAddress}
      onCreateInbox={props.onCreateInbox}
      onSelectInbox={props.onSelectInbox}
      onRefresh={props.onRefresh}
      onSelectMessage={selectMessage}
      onToggleDetails={() => setDetailsOpen((open) => !open)}
      onDeleteMessage={props.onDeleteMessage}
      onTabChange={setActiveTab}
      onRetryMessage={props.onRetryMessage}
      onCreateApiKey={props.onCreateApiKey}
      onRevokeApiKey={props.onRevokeApiKey}
      onDownloadAttachment={props.onDownloadAttachment}
    />
  );
}
