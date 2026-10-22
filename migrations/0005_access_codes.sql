CREATE TABLE `access_codes` (
	`code_hash` text PRIMARY KEY NOT NULL,
	`plan` text DEFAULT 'starter' NOT NULL,
	`note` text,
	`created_at` integer NOT NULL,
	`expires_at` integer,
	`redeemed_by_organisation_id` text,
	`redeemed_at` integer
);
--> statement-breakpoint
CREATE INDEX `idx_access_codes_redeemed_by` ON `access_codes` (`redeemed_by_organisation_id`);
