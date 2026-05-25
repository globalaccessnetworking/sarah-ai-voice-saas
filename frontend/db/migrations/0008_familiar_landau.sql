CREATE TABLE "vicidial_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"vicidial_campaign_id" varchar(100),
	"vicidial_list_id" varchar(100),
	"vicidial_ingroup" varchar(100),
	"agent_id" text,
	"opening_message" text,
	"call_goal" text,
	"script" text,
	"lead_field_mapping" jsonb,
	"disposition_mapping" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "campaign_numbers" ADD COLUMN "lead_data" jsonb;--> statement-breakpoint
ALTER TABLE "vicidial_mappings" ADD CONSTRAINT "vicidial_mappings_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE set null ON UPDATE no action;
