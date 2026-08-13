CREATE TABLE IF NOT EXISTS "data_retention_policies" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "message_content_days" integer DEFAULT 365 NOT NULL,
  "voice_transcript_days" integer DEFAULT 180 NOT NULL,
  "recording_days" integer DEFAULT 30 NOT NULL,
  "audit_log_days" integer DEFAULT 730 NOT NULL,
  "last_run_at" timestamp with time zone,
  "updated_by" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "data_retention_policies_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade
);
CREATE UNIQUE INDEX IF NOT EXISTS "data_retention_org_idx" ON "data_retention_policies" USING btree ("organization_id");

CREATE TABLE IF NOT EXISTS "privacy_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "customer_id" uuid,
  "request_type" text NOT NULL,
  "status" text DEFAULT 'completed' NOT NULL,
  "requested_by" text NOT NULL,
  "details" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "completed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "privacy_requests_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade,
  CONSTRAINT "privacy_requests_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null
);
CREATE INDEX IF NOT EXISTS "privacy_requests_org_created_idx" ON "privacy_requests" USING btree ("organization_id", "created_at");
