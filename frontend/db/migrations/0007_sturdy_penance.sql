ALTER TABLE "agents" ADD COLUMN "eligibility_rules" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "campaign_type" varchar(50) DEFAULT 'progressive';--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "caller_id" varchar(50);--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "opening_message" text;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "call_goal" text;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "script" text;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "dialing_mode" varchar(50) DEFAULT 'progressive';--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "retry_attempts" integer DEFAULT 3;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "retry_delay_seconds" integer DEFAULT 3600;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "timezone" varchar(50) DEFAULT 'UTC';--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "calling_window_start" varchar(10) DEFAULT '09:00';--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "calling_window_end" varchar(10) DEFAULT '18:00';--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "days_of_week" jsonb DEFAULT '["Monday","Tuesday","Wednesday","Thursday","Friday"]'::jsonb;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "recording_enabled" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "transcription_enabled" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "vicidial_campaign_id" varchar(100);--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "vicidial_ingroup" varchar(100);--> statement-breakpoint
ALTER TABLE "complaints" ADD COLUMN "asterisk_number" text;