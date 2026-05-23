CREATE TABLE "workspace_branding" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" text NOT NULL,
	"company_name" text NOT NULL,
	"logo_url" text,
	"primary_color" text DEFAULT '#10b981' NOT NULL,
	"accent_color" text DEFAULT '#3b82f6' NOT NULL,
	"support_email" text,
	"website_url" text,
	"custom_domain" text,
	"dkim_status" text DEFAULT 'PENDING' NOT NULL,
	"spf_status" text DEFAULT 'PENDING' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_branding_workspace_id_unique" UNIQUE("workspace_id")
);
--> statement-breakpoint
ALTER TABLE "email_configurations" ADD COLUMN "aws_region" text;--> statement-breakpoint
ALTER TABLE "email_configurations" ADD COLUMN "priority" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "email_configurations" ADD COLUMN "health_status" text DEFAULT 'HEALTHY' NOT NULL;--> statement-breakpoint
ALTER TABLE "email_configurations" ADD COLUMN "last_checked_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "service_alert_configurations" ADD COLUMN "slack_webhook_url" text;--> statement-breakpoint
ALTER TABLE "service_alert_configurations" ADD COLUMN "cpu_threshold" integer DEFAULT 80 NOT NULL;--> statement-breakpoint
ALTER TABLE "service_alert_configurations" ADD COLUMN "memory_threshold" integer DEFAULT 80 NOT NULL;--> statement-breakpoint
ALTER TABLE "service_alert_configurations" ADD COLUMN "storage_threshold" integer DEFAULT 90 NOT NULL;--> statement-breakpoint
ALTER TABLE "service_alert_configurations" ADD COLUMN "enable_slack" boolean DEFAULT false NOT NULL;