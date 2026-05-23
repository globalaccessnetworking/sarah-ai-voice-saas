CREATE TABLE "complaints" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticket_id" text,
	"name" text,
	"phone" text,
	"issue" text,
	"district" text,
	"address" text,
	"landmark" text,
	"status" text DEFAULT 'Pending',
	"priority" text DEFAULT 'Normal',
	"notes" text,
	"sentiment" text,
	"recording_id" text,
	"room_name" text,
	"outbound_status" text DEFAULT 'pending',
	"citizen_feedback" text,
	"outbound_retry_count" integer DEFAULT 0,
	"outbound_sip_call_id" text,
	"outbound_error" text,
	"last_called_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "email_branding_profile" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_name" varchar(255) DEFAULT 'Global Access AI',
	"logo_url" varchar(1024),
	"primary_color" varchar(7) DEFAULT '#22c55e',
	"support_email" varchar(255),
	"custom_domain" varchar(255),
	"is_domain_verified" boolean DEFAULT false,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "knowledge_base" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" text,
	"category" text,
	"question" text,
	"answer" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "knowledge_base_files" (
	"id" text PRIMARY KEY NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_size" integer NOT NULL,
	"file_type" varchar(100) NOT NULL,
	"status" varchar(50) DEFAULT 'Vectorizing' NOT NULL,
	"vector_count" integer DEFAULT 0,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reporting_configuration" (
	"id" serial PRIMARY KEY NOT NULL,
	"enable_daily_summary" boolean DEFAULT true,
	"execution_time" varchar(5) DEFAULT '23:59',
	"timezone" varchar DEFAULT 'UTC',
	"recipient_emails" text,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tts_custom_vocabulary" (
	"id" text PRIMARY KEY NOT NULL,
	"agent_id" text,
	"phrase" varchar(50) NOT NULL,
	"replacement" varchar(50) NOT NULL,
	"is_synced" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "campaigns" ALTER COLUMN "sip_trunk_id" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "campaigns" ALTER COLUMN "agent_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "campaigns" ALTER COLUMN "stats" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "tts_dictionary_id" text;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "outbound_greeting_text" text;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "outbound_greeting_wav" text;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "resolved_farewell_text" text;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "resolved_farewell_wav" text;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "unresolved_farewell_text" text;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "unresolved_farewell_wav" text;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "outbound_batch_limit" integer DEFAULT 5;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "outbound_retry_interval" integer DEFAULT 120;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "outbound_max_retries" integer DEFAULT 3;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "outbound_allowed_start" text DEFAULT '09:00';--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "outbound_allowed_end" text DEFAULT '20:00';--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "is_outbound_active" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "bypass_operating_hours" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "outbound_stt_model" text DEFAULT 'nova-2-general' NOT NULL;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "outbound_llm_model" text DEFAULT 'gpt-4o' NOT NULL;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "outbound_llm_temperature" numeric(4, 2) DEFAULT '0.5' NOT NULL;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "outbound_tts_voice_id" text DEFAULT 'v_meklc281' NOT NULL;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "outbound_tts_dictionary_id" text;--> statement-breakpoint
ALTER TABLE "knowledge_base" ADD CONSTRAINT "knowledge_base_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tts_custom_vocabulary" ADD CONSTRAINT "tts_custom_vocabulary_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_agents_created_at" ON "agents" USING btree ("created_at");