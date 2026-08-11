CREATE TABLE "voice_knowledge_sources" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "agent_id" uuid NOT NULL REFERENCES "voice_agents"("id") ON DELETE CASCADE,
  "source_type" text NOT NULL,
  "source_name" text NOT NULL,
  "checksum" text NOT NULL,
  "character_count" integer NOT NULL,
  "status" text DEFAULT 'review' NOT NULL,
  "summary" text NOT NULL,
  "proposal" jsonb NOT NULL,
  "created_by" text NOT NULL,
  "applied_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX "voice_knowledge_org_checksum_idx" ON "voice_knowledge_sources" USING btree ("organization_id", "checksum");
CREATE INDEX "voice_knowledge_org_created_idx" ON "voice_knowledge_sources" USING btree ("organization_id", "created_at");
