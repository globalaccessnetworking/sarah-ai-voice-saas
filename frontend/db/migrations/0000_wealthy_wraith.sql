CREATE TABLE "agent_tools" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"tool_id" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "agents" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"system_prompt" text DEFAULT '' NOT NULL,
	"initial_greeting" text DEFAULT '',
	"knowledge_base" text DEFAULT '',
	"tool_instructions" text DEFAULT '',
	"status" text DEFAULT 'stopped' NOT NULL,
	"pipeline_mode" text DEFAULT 'standard' NOT NULL,
	"llm_provider" text DEFAULT 'openai' NOT NULL,
	"llm_model" text DEFAULT 'gpt-4o' NOT NULL,
	"llm_temperature" numeric(4, 2) DEFAULT '0.8' NOT NULL,
	"llm_azure_deployment" text,
	"stt_provider" text DEFAULT 'deepgram' NOT NULL,
	"stt_model" text DEFAULT 'nova-3-general' NOT NULL,
	"stt_language" text DEFAULT 'en-US' NOT NULL,
	"stt_responsiveness" numeric(3, 2) DEFAULT '0.6' NOT NULL,
	"stt_detect_language" boolean DEFAULT false NOT NULL,
	"stt_custom_vocab" text,
	"stt_smart_formatting" boolean DEFAULT true NOT NULL,
	"stt_remove_fillers" boolean DEFAULT true NOT NULL,
	"stt_azure_deployment" text,
	"tts_provider" text DEFAULT 'cartesia' NOT NULL,
	"tts_model" text DEFAULT 'sonic-2' NOT NULL,
	"tts_voice_id" text,
	"tts_language" text DEFAULT 'en-US',
	"tts_speed" numeric(4, 2),
	"elevenlabs_stability" numeric(4, 2),
	"elevenlabs_similarity" numeric(4, 2),
	"tts_azure_deployment" text,
	"rt_provider" text DEFAULT 'google',
	"rt_model" text DEFAULT 'gemini-2.5-flash-native-audio-preview-12-2025',
	"rt_voice" text DEFAULT 'Puck',
	"rt_language" text,
	"rt_modalities" text DEFAULT 'text_audio' NOT NULL,
	"rt_proactivity" boolean DEFAULT false NOT NULL,
	"rt_affective_dialog" boolean DEFAULT false NOT NULL,
	"rt_noise_reduction" boolean DEFAULT false NOT NULL,
	"rt_thinking_budget" text DEFAULT 'auto',
	"rt_max_output_tokens" integer,
	"rt_top_p" numeric(4, 2),
	"rt_temperature" numeric(4, 2) DEFAULT '0.8',
	"rt_speed" numeric(4, 2),
	"rt_turn_detection" text,
	"rt_turn_detection_eagerness" text,
	"rt_ctx_compression_enabled" boolean DEFAULT false NOT NULL,
	"rt_ctx_compression_trigger" integer,
	"rt_ctx_compression_target" integer,
	"rt_azure_deployment" text,
	"tools_config" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"extra_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agents_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid,
	"user_email" varchar(255) NOT NULL,
	"action" varchar(100) NOT NULL,
	"resource_type" varchar(100),
	"resource_id" varchar(255),
	"details" text,
	"ip_address" varchar(45)
);
--> statement-breakpoint
CREATE TABLE "call_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"session_id" text,
	"room_name" text,
	"direction" text DEFAULT 'inbound' NOT NULL,
	"status" text DEFAULT 'completed' NOT NULL,
	"from_number" text,
	"to_number" text,
	"transcript" jsonb DEFAULT '[]'::jsonb,
	"summary" text,
	"recording_url" text,
	"duration_seconds" integer DEFAULT 0,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_numbers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid,
	"phone" varchar(50) NOT NULL,
	"name" varchar(255),
	"company_name" varchar(255),
	"status" varchar(50) DEFAULT 'pending',
	"called_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'idle',
	"sip_trunk_id" uuid,
	"agent_id" uuid,
	"concurrency" integer DEFAULT 1,
	"call_delay_seconds" integer DEFAULT 0,
	"stats" jsonb DEFAULT '{"total":0,"completed":0,"failed":0}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "dispatch_rules" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"phone_number_id" varchar(64) NOT NULL,
	"agent_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" text PRIMARY KEY NOT NULL,
	"kb_id" text NOT NULL,
	"filename" varchar(512) NOT NULL,
	"file_type" varchar(128) NOT NULL,
	"size_bytes" integer DEFAULT 0 NOT NULL,
	"status" varchar(32) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "email_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enable_service" boolean DEFAULT false NOT NULL,
	"provider" text DEFAULT 'SMTP' NOT NULL,
	"smtp_host" text,
	"smtp_port" integer DEFAULT 587 NOT NULL,
	"username" text,
	"password" text,
	"use_tls" boolean DEFAULT true NOT NULL,
	"from_email" text,
	"from_name" text,
	"reply_to_email" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"recipient" text NOT NULL,
	"subject" text NOT NULL,
	"template_type" text NOT NULL,
	"status" text NOT NULL,
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE "email_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"unique_identifier" text NOT NULL,
	"type" text DEFAULT 'SYSTEM' NOT NULL,
	"subject" text NOT NULL,
	"html_content" text NOT NULL,
	"expected_variables" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_templates_unique_identifier_unique" UNIQUE("unique_identifier")
);
--> statement-breakpoint
CREATE TABLE "knowledge_bases" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "phone_numbers" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"number" varchar(255) NOT NULL,
	"friendly_name" varchar(255),
	"trunk_id" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "phone_numbers_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "recordings" (
	"id" text PRIMARY KEY NOT NULL,
	"filename" varchar(512) NOT NULL,
	"agent_name" varchar(255),
	"room_name" varchar(255) NOT NULL,
	"size_bytes" integer DEFAULT 0 NOT NULL,
	"duration_seconds" integer DEFAULT 0 NOT NULL,
	"storage_location" varchar(32) DEFAULT 'local' NOT NULL,
	"object_key" varchar(1024),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "report_history" (
	"id" text PRIMARY KEY NOT NULL,
	"rule_id" text NOT NULL,
	"status" varchar(32) NOT NULL,
	"error_message" text,
	"executed_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "report_rules" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"trigger_type" varchar(32) NOT NULL,
	"schedule_config" jsonb DEFAULT '{}'::jsonb,
	"agent_filter" jsonb DEFAULT '[]'::jsonb,
	"direction_filter" varchar(32) DEFAULT 'all' NOT NULL,
	"recipients" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"template_id" varchar(255),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "service_alert_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enable_alerts" boolean DEFAULT false NOT NULL,
	"recipient_emails" text NOT NULL,
	"monitored_services" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"alert_cooldown" integer DEFAULT 30 NOT NULL,
	"check_interval" integer DEFAULT 60 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sip_trunks" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"type" varchar(32) NOT NULL,
	"name" varchar(255) NOT NULL,
	"numbers" jsonb DEFAULT '[]'::jsonb,
	"address" varchar(255),
	"transport" varchar(32) DEFAULT 'tcp',
	"allowed_addresses" jsonb DEFAULT '[]'::jsonb,
	"allowed_numbers" jsonb DEFAULT '[]'::jsonb,
	"auth_username" varchar(255),
	"auth_password" varchar(255),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"headers" jsonb DEFAULT '{}'::jsonb,
	"headers_to_attributes" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "system_integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_name" varchar(50) NOT NULL,
	"api_key" text,
	"config_json" jsonb DEFAULT '{}'::jsonb,
	"region" varchar(50),
	"is_active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "system_integrations_provider_name_unique" UNIQUE("provider_name")
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" varchar(50) PRIMARY KEY DEFAULT 'global_config' NOT NULL,
	"api_keys" jsonb DEFAULT '{}'::jsonb,
	"pricing_config" jsonb DEFAULT '{}'::jsonb,
	"branding_config" jsonb DEFAULT '{}'::jsonb,
	"storage_config" jsonb DEFAULT '{}'::jsonb,
	"email_config" jsonb DEFAULT '{}'::jsonb,
	"backup_config" jsonb DEFAULT '{}'::jsonb,
	"notes_config" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tools" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"type" varchar(32) DEFAULT 'webhook' NOT NULL,
	"endpoint_url" varchar(2048),
	"parameters_schema" jsonb DEFAULT '{}'::jsonb,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true,
	"two_factor_secret" varchar(255),
	"two_factor_enabled" boolean DEFAULT false,
	"backup_codes" jsonb,
	"margin_config" jsonb,
	"monthly_minutes_quota" integer DEFAULT 0,
	"assigned_agents" jsonb,
	"assigned_numbers" jsonb,
	"permissions" jsonb,
	"reset_token" varchar(255),
	"reset_token_expiry" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "web_chat_agents" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"enabled" boolean DEFAULT true,
	"description" text,
	"llm_provider" varchar(64) DEFAULT 'openai' NOT NULL,
	"llm_model" varchar(128) DEFAULT 'gpt-4o-mini' NOT NULL,
	"temperature" numeric(3, 2) DEFAULT '0.70',
	"max_tokens" integer DEFAULT 1024,
	"system_prompt" text NOT NULL,
	"knowledge_base" text,
	"tool_instructions" text,
	"widget_config" jsonb DEFAULT '{}'::jsonb,
	"voice_enabled" boolean DEFAULT false,
	"voice_config" jsonb DEFAULT '{}'::jsonb,
	"allowed_origins" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "agent_tools" ADD CONSTRAINT "agent_tools_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_tools" ADD CONSTRAINT "agent_tools_tool_id_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_logs" ADD CONSTRAINT "call_logs_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_numbers" ADD CONSTRAINT "campaign_numbers_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_sip_trunk_id_sip_trunks_id_fk" FOREIGN KEY ("sip_trunk_id") REFERENCES "public"."sip_trunks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatch_rules" ADD CONSTRAINT "dispatch_rules_phone_number_id_phone_numbers_id_fk" FOREIGN KEY ("phone_number_id") REFERENCES "public"."phone_numbers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatch_rules" ADD CONSTRAINT "dispatch_rules_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_kb_id_knowledge_bases_id_fk" FOREIGN KEY ("kb_id") REFERENCES "public"."knowledge_bases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phone_numbers" ADD CONSTRAINT "phone_numbers_trunk_id_sip_trunks_id_fk" FOREIGN KEY ("trunk_id") REFERENCES "public"."sip_trunks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_history" ADD CONSTRAINT "report_history_rule_id_report_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."report_rules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_agent_tools_agent_id" ON "agent_tools" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "idx_agent_tools_tool_id" ON "agent_tools" USING btree ("tool_id");--> statement-breakpoint
CREATE INDEX "idx_agents_status" ON "agents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_agents_slug" ON "agents" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_call_logs_agent_id" ON "call_logs" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "idx_call_logs_started_at" ON "call_logs" USING btree ("started_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_dispatch_rules_phone_number_id" ON "dispatch_rules" USING btree ("phone_number_id");--> statement-breakpoint
CREATE INDEX "idx_documents_kb_id" ON "documents" USING btree ("kb_id");--> statement-breakpoint
CREATE INDEX "idx_phone_numbers_trunk_id" ON "phone_numbers" USING btree ("trunk_id");--> statement-breakpoint
CREATE INDEX "idx_recordings_room_name" ON "recordings" USING btree ("room_name");--> statement-breakpoint
CREATE INDEX "idx_recordings_created_at" ON "recordings" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_report_history_rule_id" ON "report_history" USING btree ("rule_id");--> statement-breakpoint
CREATE INDEX "idx_report_history_executed_at" ON "report_history" USING btree ("executed_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_report_rules_trigger_type" ON "report_rules" USING btree ("trigger_type");--> statement-breakpoint
CREATE INDEX "idx_sip_trunks_type" ON "sip_trunks" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_sip_trunks_created_at" ON "sip_trunks" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_tools_type" ON "tools" USING btree ("type");