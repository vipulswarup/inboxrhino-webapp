CREATE TABLE `long_polls` (
	`id` text PRIMARY KEY NOT NULL,
	`organisation_id` text NOT NULL,
	`api_key_id` text NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_long_polls_org_expires` ON `long_polls` (`organisation_id`,`expires_at`);--> statement-breakpoint
CREATE INDEX `idx_long_polls_key_expires` ON `long_polls` (`api_key_id`,`expires_at`);