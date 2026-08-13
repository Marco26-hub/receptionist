import { and, eq } from "drizzle-orm";
import { getDb, isDatabaseConfigured } from "../../db";
import { auditLogs, subscriptions, voiceAgents } from "../../db/schema";
import { getBillingEntitlements, billingEnforcementEnabled } from "./billing-entitlements";
import { setRetellPhoneActive } from "./retell";

export async function enforceBillingAfterSubscriptionChange(organizationId: string) {
  if (!billingEnforcementEnabled() || !isDatabaseConfigured()) return { enforced: false, reason: "disabled" as const };
  const entitlements = await getBillingEntitlements(organizationId);
  const db = getDb();
  if (entitlements.voice.allowed) {
    const pausedByBilling = await db.query.voiceAgents.findFirst({ where: and(eq(voiceAgents.organizationId, organizationId), eq(voiceAgents.billingPaused, true)) });
    if (!pausedByBilling) return { enforced: false, reason: "voice_allowed" as const };
    if (!pausedByBilling.retellAgentId || !pausedByBilling.retellPhoneNumber) throw new Error("Impossibile riattivare la voce: collegamento Retell incompleto");
    await setRetellPhoneActive(pausedByBilling.retellPhoneNumber, pausedByBilling.retellAgentId, true);
    await db.transaction(async (transaction) => {
      await transaction.update(voiceAgents).set({ status: "live", billingPaused: false, updatedAt: new Date() }).where(and(eq(voiceAgents.id, pausedByBilling.id), eq(voiceAgents.organizationId, organizationId)));
      await transaction.insert(auditLogs).values({ organizationId, action: "billing.voice.resumed", entityType: "voice_agent", entityId: pausedByBilling.id, metadata: { subscriptionStatus: entitlements.subscriptionStatus, plan: entitlements.planKey } });
    });
    return { enforced: true, reason: "voice_resumed" as const };
  }
  const agent = await db.query.voiceAgents.findFirst({ where: and(eq(voiceAgents.organizationId, organizationId), eq(voiceAgents.status, "live")) });
  if (!agent) return { enforced: false, reason: "not_live" as const };
  if (!agent.retellAgentId || !agent.retellPhoneNumber) throw new Error("Impossibile sospendere la voce: collegamento Retell incompleto");
  await setRetellPhoneActive(agent.retellPhoneNumber, agent.retellAgentId, false);
  await db.transaction(async (transaction) => {
    await transaction.update(voiceAgents).set({ status: "paused", billingPaused: true, updatedAt: new Date() }).where(and(eq(voiceAgents.id, agent.id), eq(voiceAgents.organizationId, organizationId)));
    await transaction.insert(auditLogs).values({ organizationId, action: "billing.voice.paused", entityType: "voice_agent", entityId: agent.id, metadata: { subscriptionStatus: entitlements.subscriptionStatus, plan: entitlements.planKey, reason: entitlements.voice.reason } });
  });
  return { enforced: true, reason: "voice_paused" as const };
}

export async function enforceAllBillingStates() {
  if (!billingEnforcementEnabled() || !isDatabaseConfigured()) return { checked: 0, paused: 0, failed: 0, enabled: false };
  const db = getDb();
  const rows = await db.select({ organizationId: subscriptions.organizationId }).from(subscriptions);
  const organizationIds = [...new Set(rows.map((row) => row.organizationId))];
  let paused = 0;
  let failed = 0;
  for (const organizationId of organizationIds) {
    try {
      const result = await enforceBillingAfterSubscriptionChange(organizationId);
      if (result.enforced) paused += 1;
    } catch (error) {
      failed += 1;
      await db.insert(auditLogs).values({
        organizationId,
        action: "billing.enforcement.failed",
        entityType: "subscription",
        entityId: organizationId,
        metadata: { error: error instanceof Error ? error.message.slice(0, 500) : "Errore sconosciuto" },
      });
    }
  }
  return { checked: organizationIds.length, paused, failed, enabled: true };
}
