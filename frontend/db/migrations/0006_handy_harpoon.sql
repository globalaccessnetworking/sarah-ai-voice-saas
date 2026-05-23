CREATE TABLE "districts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "districts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "sms_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_name" text NOT NULL,
	"api_url" text NOT NULL,
	"sender_id" text NOT NULL,
	"api_params" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT false,
	"credit_threshold" integer DEFAULT 500,
	"low_credit_alert_sent" boolean DEFAULT false,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sms_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient" text NOT NULL,
	"ticket_id" text,
	"content" text NOT NULL,
	"trigger_type" text,
	"attempt_count" integer DEFAULT 0,
	"max_retries" integer DEFAULT 3,
	"next_attempt_at" timestamp with time zone DEFAULT now(),
	"status" text DEFAULT 'PENDING',
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sms_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient" text NOT NULL,
	"ticket_id" text,
	"content" text NOT NULL,
	"status" text NOT NULL,
	"provider_response" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sms_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"trigger_type" text NOT NULL,
	"content" text NOT NULL,
	"use_unicode" boolean DEFAULT false,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "sms_templates_trigger_type_unique" UNIQUE("trigger_type")
);
--> statement-breakpoint
CREATE TABLE "supervisor_registry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"phone_number" text NOT NULL,
	"district_id" integer,
	"is_primary" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "supervisor_registry" ADD CONSTRAINT "supervisor_registry_district_id_districts_id_fk" FOREIGN KEY ("district_id") REFERENCES "public"."districts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_supervisor_phone" ON "supervisor_registry" USING btree ("phone_number");--> statement-breakpoint
CREATE INDEX "idx_supervisor_district" ON "supervisor_registry" USING btree ("district_id");