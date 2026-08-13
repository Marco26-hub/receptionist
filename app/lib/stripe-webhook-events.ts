import { and, eq, sql } from "drizzle-orm";
import { getDb, isDatabaseConfigured } from "../../db";
import { stripeWebhookEvents } from "../../db/schema";

export type StripeWebhookEvent = { id: string; type: string; created?: number; data: { object: Record<string, unknown> } };

export async function claimStripeWebhookEvent(event: StripeWebhookEvent) {
  if (!isDatabaseConfigured()) return true;
  const db = getDb();
  const now = new Date();
  const [inserted] = await db.insert(stripeWebhookEvents).values({
    id: event.id,
    eventType: event.type,
    stripeCreatedAt: typeof event.created === "number" ? new Date(event.created * 1000) : null,
  }).onConflictDoNothing().returning({ id: stripeWebhookEvents.id });
  if (inserted) return true;

  const existing = await db.query.stripeWebhookEvents.findFirst({ where: eq(stripeWebhookEvents.id, event.id) });
  if (!existing || existing.status === "processed") return false;
  if (existing.status === "processing" && existing.updatedAt > new Date(now.getTime() - 5 * 60_000)) return false;
  const [claimed] = await db.update(stripeWebhookEvents).set({
    status: "processing",
    attempts: sql`${stripeWebhookEvents.attempts} + 1`,
    lastError: null,
    updatedAt: now,
  }).where(and(eq(stripeWebhookEvents.id, event.id), eq(stripeWebhookEvents.status, existing.status), eq(stripeWebhookEvents.updatedAt, existing.updatedAt))).returning({ id: stripeWebhookEvents.id });
  return Boolean(claimed);
}

export async function completeStripeWebhookEvent(eventId: string) {
  if (!isDatabaseConfigured()) return;
  const now = new Date();
  await getDb().update(stripeWebhookEvents).set({ status: "processed", processedAt: now, lastError: null, updatedAt: now }).where(eq(stripeWebhookEvents.id, eventId));
}

export async function failStripeWebhookEvent(eventId: string, error: unknown) {
  if (!isDatabaseConfigured()) return;
  await getDb().update(stripeWebhookEvents).set({ status: "failed", lastError: error instanceof Error ? error.message.slice(0, 1000) : "Errore sconosciuto", updatedAt: new Date() }).where(eq(stripeWebhookEvents.id, eventId));
}
