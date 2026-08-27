import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const organisations = sqliteTable('organisations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  plan: text('plan', { enum: ['free'] }).notNull().default('free'),
  signupCountry: text('signup_country'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

export const apiKeys = sqliteTable(
  'api_keys',
  {
    id: text('id').primaryKey(),
    organisationId: text('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    prefix: text('prefix').notNull(),
    secretHash: text('secret_hash').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    lastUsedAt: integer('last_used_at', { mode: 'timestamp_ms' }),
    revokedAt: integer('revoked_at', { mode: 'timestamp_ms' }),
  },
  (table) => [index('idx_api_keys_organisation').on(table.organisationId), uniqueIndex('idx_api_keys_prefix').on(table.prefix)],
);

export const domains = sqliteTable('domains', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

export const inboxes = sqliteTable(
  'inboxes',
  {
    id: text('id').primaryKey(),
    organisationId: text('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    domainId: text('domain_id')
      .notNull()
      .references(() => domains.id),
    localPart: text('local_part').notNull(),
    address: text('address').notNull(),
    status: text('status', { enum: ['active', 'deleted'] }).notNull().default('active'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    deletedAt: integer('deleted_at', { mode: 'timestamp_ms' }),
    quarantineUntil: integer('quarantine_until', { mode: 'timestamp_ms' }),
  },
  (table) => [
    uniqueIndex('idx_inboxes_address').on(table.address),
    index('idx_inboxes_organisation_status_created').on(table.organisationId, table.status, table.createdAt),
  ],
);

export const messages = sqliteTable(
  'messages',
  {
    id: text('id').primaryKey(),
    organisationId: text('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    inboxId: text('inbox_id')
      .notNull()
      .references(() => inboxes.id, { onDelete: 'cascade' }),
    internetMessageId: text('internet_message_id'),
    senderEmail: text('sender_email').notNull(),
    senderName: text('sender_name').notNull().default(''),
    recipient: text('recipient').notNull(),
    subject: text('subject').notNull().default(''),
    preview: text('preview').notNull().default(''),
    headersJson: text('headers_json').notNull(),
    textObjectKey: text('text_object_key'),
    htmlObjectKey: text('html_object_key'),
    sizeBytes: integer('size_bytes').notNull(),
    receivedAt: integer('received_at', { mode: 'timestamp_ms' }).notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    index('idx_messages_inbox_received').on(table.inboxId, table.receivedAt),
    index('idx_messages_org_received').on(table.organisationId, table.receivedAt),
  ],
);

export const attachments = sqliteTable(
  'attachments',
  {
    id: text('id').primaryKey(),
    organisationId: text('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    messageId: text('message_id')
      .notNull()
      .references(() => messages.id, { onDelete: 'cascade' }),
    filename: text('filename').notNull(),
    contentType: text('content_type').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    objectKey: text('object_key').notNull(),
    disposition: text('disposition').notNull().default('attachment'),
    contentId: text('content_id'),
  },
  (table) => [index('idx_attachments_message').on(table.messageId)],
);

export const usageCounters = sqliteTable(
  'usage_counters',
  {
    organisationId: text('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    periodStart: text('period_start').notNull(),
    receivedCount: integer('received_count').notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.organisationId, table.periodStart] })],
);

export const idempotencyKeys = sqliteTable(
  'idempotency_keys',
  {
    organisationId: text('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    key: text('key').notNull(),
    responseJson: text('response_json').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.organisationId, table.key] }), index('idx_idempotency_expires').on(table.expiresAt)],
);

export const rateLimits = sqliteTable(
  'rate_limits',
  {
    scope: text('scope').notNull(),
    bucket: text('bucket').notNull(),
    count: integer('count').notNull().default(0),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.scope, table.bucket] }), index('idx_rate_limits_expires').on(table.expiresAt)],
);

export const longPolls = sqliteTable(
  'long_polls',
  {
    id: text('id').primaryKey(),
    organisationId: text('organisation_id').notNull(),
    apiKeyId: text('api_key_id').notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [index('idx_long_polls_org_expires').on(table.organisationId, table.expiresAt), index('idx_long_polls_key_expires').on(table.apiKeyId, table.expiresAt)],
);

export const auditEvents = sqliteTable(
  'audit_events',
  {
    id: text('id').primaryKey(),
    organisationId: text('organisation_id'),
    actorId: text('actor_id'),
    action: text('action').notNull(),
    targetId: text('target_id'),
    requestId: text('request_id').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [index('idx_audit_org_created').on(table.organisationId, table.createdAt), index('idx_audit_expires').on(table.expiresAt)],
);
