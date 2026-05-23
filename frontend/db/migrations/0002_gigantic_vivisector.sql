ALTER TABLE "call_logs" ADD COLUMN "duration" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "call_logs" ADD COLUMN "total_cost" numeric(10, 2) DEFAULT '0.00';