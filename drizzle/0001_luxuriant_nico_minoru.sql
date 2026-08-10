ALTER TYPE "public"."message_status" ADD VALUE 'received' BEFORE 'failed';--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "direction" text DEFAULT 'outbound' NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL;