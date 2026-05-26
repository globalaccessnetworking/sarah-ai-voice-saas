ALTER TABLE "campaign_numbers" ADD COLUMN "attempt_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "campaign_numbers" ADD COLUMN "last_attempt_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "campaign_numbers" ADD COLUMN "next_retry_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "campaign_numbers" ADD COLUMN "failure_reason" varchar(255);--> statement-breakpoint
ALTER TABLE "campaign_numbers" ADD COLUMN "disposition" varchar(50);--> statement-breakpoint
ALTER TABLE "campaign_numbers" ADD COLUMN "last_call_duration_seconds" integer;