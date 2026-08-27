CREATE TABLE `api_keys` (
	`id` text PRIMARY KEY NOT NULL,
	`organisation_id` text NOT NULL,
	`name` text NOT NULL,
	`prefix` text NOT NULL,
	`secret_hash` text NOT NULL,
	`created_at` integer NOT NULL,
	`last_used_at` integer,
	`revoked_at` integer,
	FOREIGN KEY (`organisation_id`) REFERENCES `organisations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_api_keys_organisation` ON `api_keys` (`organisation_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_api_keys_prefix` ON `api_keys` (`prefix`);--> statement-breakpoint
CREATE TABLE `attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`organisation_id` text NOT NULL,
	`message_id` text NOT NULL,
	`filename` text NOT NULL,
	`content_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`object_key` text NOT NULL,
	`disposition` text DEFAULT 'attachment' NOT NULL,
	`content_id` text,
	FOREIGN KEY (`organisation_id`) REFERENCES `organisations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_attachments_message` ON `attachments` (`message_id`);--> statement-breakpoint
CREATE TABLE `audit_events` (
	`id` text PRIMARY KEY NOT NULL,
	`organisation_id` text,
	`actor_id` text,
	`action` text NOT NULL,
	`target_id` text,
	`request_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_audit_org_created` ON `audit_events` (`organisation_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_audit_expires` ON `audit_events` (`expires_at`);--> statement-breakpoint
CREATE TABLE `domains` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `domains_name_unique` ON `domains` (`name`);--> statement-breakpoint
CREATE TABLE `idempotency_keys` (
	`organisation_id` text NOT NULL,
	`key` text NOT NULL,
	`response_json` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	PRIMARY KEY(`organisation_id`, `key`),
	FOREIGN KEY (`organisation_id`) REFERENCES `organisations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_idempotency_expires` ON `idempotency_keys` (`expires_at`);--> statement-breakpoint
CREATE TABLE `inboxes` (
	`id` text PRIMARY KEY NOT NULL,
	`organisation_id` text NOT NULL,
	`domain_id` text NOT NULL,
	`local_part` text NOT NULL,
	`address` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`deleted_at` integer,
	`quarantine_until` integer,
	FOREIGN KEY (`organisation_id`) REFERENCES `organisations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`domain_id`) REFERENCES `domains`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_inboxes_address` ON `inboxes` (`address`);--> statement-breakpoint
CREATE INDEX `idx_inboxes_organisation_status_created` ON `inboxes` (`organisation_id`,`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`organisation_id` text NOT NULL,
	`inbox_id` text NOT NULL,
	`internet_message_id` text,
	`sender_email` text NOT NULL,
	`sender_name` text DEFAULT '' NOT NULL,
	`recipient` text NOT NULL,
	`subject` text DEFAULT '' NOT NULL,
	`preview` text DEFAULT '' NOT NULL,
	`headers_json` text NOT NULL,
	`text_object_key` text,
	`html_object_key` text,
	`size_bytes` integer NOT NULL,
	`received_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`organisation_id`) REFERENCES `organisations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`inbox_id`) REFERENCES `inboxes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_messages_inbox_received` ON `messages` (`inbox_id`,`received_at`);--> statement-breakpoint
CREATE INDEX `idx_messages_org_received` ON `messages` (`organisation_id`,`received_at`);--> statement-breakpoint
CREATE TABLE `organisations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`plan` text DEFAULT 'free' NOT NULL,
	`signup_country` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`scope` text NOT NULL,
	`bucket` text NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`expires_at` integer NOT NULL,
	PRIMARY KEY(`scope`, `bucket`)
);
--> statement-breakpoint
CREATE INDEX `idx_rate_limits_expires` ON `rate_limits` (`expires_at`);--> statement-breakpoint
CREATE TABLE `usage_counters` (
	`organisation_id` text NOT NULL,
	`period_start` text NOT NULL,
	`received_count` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`organisation_id`, `period_start`),
	FOREIGN KEY (`organisation_id`) REFERENCES `organisations`(`id`) ON UPDATE no action ON DELETE cascade
);
