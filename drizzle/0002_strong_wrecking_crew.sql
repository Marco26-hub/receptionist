CREATE TYPE "public"."voice_agent_status" AS ENUM('draft', 'testing', 'ready', 'live', 'paused');--> statement-breakpoint
CREATE TYPE "public"."voice_call_status" AS ENUM('registered', 'ringing', 'in_progress', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "voice_agent_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"configuration" jsonb NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "voice_agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text DEFAULT 'Assistente AgendaPiena' NOT NULL,
	"status" "voice_agent_status" DEFAULT 'draft' NOT NULL,
	"provider" text DEFAULT 'retell' NOT NULL,
	"model" text DEFAULT 'gpt-5-mini' NOT NULL,
	"voice_id" text DEFAULT 'retell-Cimo' NOT NULL,
	"language" text DEFAULT 'it-IT' NOT NULL,
	"greeting" text NOT NULL,
	"system_prompt" text NOT NULL,
	"services" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"faqs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"transfer_number" text,
	"booking_enabled" boolean DEFAULT true NOT NULL,
	"recording_enabled" boolean DEFAULT false NOT NULL,
	"test_mode" boolean DEFAULT true NOT NULL,
	"retell_agent_id" text,
	"retell_phone_number" text,
	"published_version" integer DEFAULT 0 NOT NULL,
	"last_tested_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "voice_calls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"agent_id" uuid,
	"customer_id" uuid,
	"external_call_id" text,
	"direction" text DEFAULT 'inbound' NOT NULL,
	"mode" text DEFAULT 'test' NOT NULL,
	"status" "voice_call_status" DEFAULT 'registered' NOT NULL,
	"from_number" text,
	"to_number" text,
	"duration_seconds" integer DEFAULT 0 NOT NULL,
	"cost_cents" integer DEFAULT 0 NOT NULL,
	"summary" text,
	"outcome" text,
	"transcript" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"extracted_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"recording_url" text,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "voice_test_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"scenario" text NOT NULL,
	"status" text NOT NULL,
	"input" text NOT NULL,
	"output" text NOT NULL,
	"checks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "voice_agent_versions" ADD CONSTRAINT "voice_agent_versions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voice_agent_versions" ADD CONSTRAINT "voice_agent_versions_agent_id_voice_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."voice_agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voice_agents" ADD CONSTRAINT "voice_agents_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voice_calls" ADD CONSTRAINT "voice_calls_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voice_calls" ADD CONSTRAINT "voice_calls_agent_id_voice_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."voice_agents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voice_calls" ADD CONSTRAINT "voice_calls_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voice_test_runs" ADD CONSTRAINT "voice_test_runs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voice_test_runs" ADD CONSTRAINT "voice_test_runs_agent_id_voice_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."voice_agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "voice_agent_versions_unique_idx" ON "voice_agent_versions" USING btree ("agent_id","version");--> statement-breakpoint
CREATE INDEX "voice_agent_versions_org_idx" ON "voice_agent_versions" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "voice_agents_org_idx" ON "voice_agents" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "voice_agents_retell_idx" ON "voice_agents" USING btree ("retell_agent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "voice_calls_external_idx" ON "voice_calls" USING btree ("external_call_id");--> statement-breakpoint
CREATE INDEX "voice_calls_org_created_idx" ON "voice_calls" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "voice_test_runs_org_created_idx" ON "voice_test_runs" USING btree ("organization_id","created_at");