ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "calendar_provider" text;
--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "calendar_event_id" text;
--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "calendar_sync_status" text DEFAULT 'not_connected' NOT NULL;
--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "calendar_sync_error" text;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "appointments_org_calendar_idx" ON "appointments" USING btree ("organization_id", "calendar_provider", "calendar_event_id");
