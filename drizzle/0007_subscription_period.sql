ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "current_period_start" timestamp with time zone;
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "status_changed_at" timestamp with time zone DEFAULT now() NOT NULL;
CREATE INDEX IF NOT EXISTS "subscriptions_org_updated_idx" ON "subscriptions" USING btree ("organization_id", "updated_at");
CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_stripe_id_idx" ON "subscriptions" USING btree ("stripe_subscription_id");
CREATE INDEX IF NOT EXISTS "messages_org_sent_idx" ON "messages" USING btree ("organization_id", "sent_at");

CREATE TABLE IF NOT EXISTS "stripe_webhook_events" (
  "id" text PRIMARY KEY,
  "event_type" text NOT NULL,
  "status" text DEFAULT 'processing' NOT NULL,
  "attempts" integer DEFAULT 1 NOT NULL,
  "last_error" text,
  "stripe_created_at" timestamp with time zone,
  "processed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "stripe_webhook_status_updated_idx" ON "stripe_webhook_events" USING btree ("status", "updated_at");

ALTER TABLE "voice_agents" ADD COLUMN IF NOT EXISTS "billing_paused" boolean DEFAULT false NOT NULL;
