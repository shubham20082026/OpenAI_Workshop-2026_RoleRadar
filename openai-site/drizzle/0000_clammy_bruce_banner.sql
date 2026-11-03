CREATE TABLE `public_job_catalog` (
	`job_id` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`expires_at` integer NOT NULL,
	`closed_until` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `public_job_catalog_expiry` ON `public_job_catalog` (`expires_at`);