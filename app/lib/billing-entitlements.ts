import { and, desc, eq, gte, lt, sql } from "drizzle-orm";
import { getDb, isDatabaseConfigured } from "../../db";
import { messages, subscriptions, voiceCalls } from "../../db/schema";
import { isStripePlanKey, stripePlans, type StripePlanKey } from "./stripe";
import { ValidationError } from "./validation";

export type BillableFeature = "voice" | "whatsapp";

export type BillingEntitlements = {
  enforcementEnabled: boolean;
  planKey: StripePlanKey | null;
  planName: string | null;
  subscriptionStatus: string | null;
  paymentAllowed: boolean;
  inGracePeriod: boolean;
  graceUntil: string | null;
  periodStart: string;
  periodEnd: string;
  voice: { included: number; used: number; remaining: number; overage: number; overageRateCents: number; estimatedOverageCents: number; enabled: boolean; allowed: boolean; reason: string | null };
  whatsapp: { included: number; used: number; remaining: number; overage: number; overageRateCents: number; estimatedOverageCents: number; enabled: boolean; allowed: boolean; reason: string | null };
};

export function billingEnforcementEnabled() {
  return process.env.BILLING_ENFORCEMENT_ENABLED === "true";
}

export async function getBillingEntitlements(organizationId: string): Promise<BillingEntitlements> {
  const now = new Date();
  const fallbackPeriod = monthPeriod(now);
  if (!isDatabaseConfigured()) return emptyEntitlements(fallbackPeriod.start, fallbackPeriod.end);
  const db = getDb();
  const subscription = await db.query.subscriptions.findFirst({ where: eq(subscriptions.organizationId, organizationId), orderBy: [desc(subscriptions.updatedAt)] });
  const planKey = subscription?.plan && isStripePlanKey(subscription.plan) ? subscription.plan : null;
  const plan = planKey ? stripePlans[planKey] : null;
  const periodEnd = subscription?.currentPeriodEnd || fallbackPeriod.end;
  const periodStart = subscription?.currentPeriodStart || inferPeriodStart(periodEnd, fallbackPeriod.start);
  const [voiceRows, whatsappRows] = await Promise.all([
    db.select({ seconds: sql<number>`coalesce(sum(${voiceCalls.durationSeconds}), 0)` }).from(voiceCalls).where(and(eq(voiceCalls.organizationId, organizationId), eq(voiceCalls.mode, "live"), gte(voiceCalls.createdAt, periodStart), lt(voiceCalls.createdAt, periodEnd))),
    db.select({ count: sql<number>`count(*)` }).from(messages).where(and(eq(messages.organizationId, organizationId), eq(messages.direction, "outbound"), gte(messages.sentAt, periodStart), lt(messages.sentAt, periodEnd))),
  ]);
  const voiceUsed = Math.round((Number(voiceRows[0]?.seconds || 0) / 60) * 10) / 10;
  const whatsappUsed = Number(whatsappRows[0]?.count || 0);
  const access = subscriptionAccess(subscription?.status || null, subscription?.statusChangedAt || null, now);
  const enforcementEnabled = billingEnforcementEnabled();
  return {
    enforcementEnabled,
    planKey,
    planName: plan?.name || null,
    subscriptionStatus: subscription?.status || null,
    paymentAllowed: access.allowed,
    inGracePeriod: access.inGracePeriod,
    graceUntil: access.graceUntil?.toISOString() || null,
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    voice: featureUsage({ feature: "voice", enabled: Boolean(plan?.voiceEnabled), allowedByPayment: access.allowed, enforcementEnabled, included: plan?.voiceMinutes || 0, used: voiceUsed, overageRateCents: plan?.voiceOverageCents || 0, hasSubscription: Boolean(subscription) }),
    whatsapp: featureUsage({ feature: "whatsapp", enabled: Boolean(plan?.whatsappEnabled), allowedByPayment: access.allowed, enforcementEnabled, included: plan?.whatsappMessages || 0, used: whatsappUsed, overageRateCents: plan?.whatsappOverageCents || 0, hasSubscription: Boolean(subscription) }),
  };
}

export async function assertOrganizationFeature(organizationId: string, feature: BillableFeature) {
  const entitlements = await getBillingEntitlements(organizationId);
  const access = entitlements[feature];
  if (!access.allowed) throw new ValidationError(access.reason || "Servizio non incluso nel piano");
  return entitlements;
}

function featureUsage(input: { feature: BillableFeature; enabled: boolean; allowedByPayment: boolean; enforcementEnabled: boolean; included: number; used: number; overageRateCents: number; hasSubscription: boolean }) {
  const overage = Math.max(0, Math.round((input.used - input.included) * 10) / 10);
  const remaining = Math.max(0, Math.round((input.included - input.used) * 10) / 10);
  const allowed = !input.enforcementEnabled || (input.hasSubscription && input.allowedByPayment && input.enabled);
  let reason: string | null = null;
  if (!allowed && !input.hasSubscription) reason = "Nessun piano attivo: scegli un abbonamento prima di usare il servizio reale";
  else if (!allowed && !input.allowedByPayment) reason = "Servizio sospeso: il pagamento dell’abbonamento richiede attenzione";
  else if (!allowed && !input.enabled) reason = input.feature === "voice" ? "La segretaria telefonica non è inclusa nel piano attuale" : "WhatsApp non è incluso nel piano attuale";
  return { included: input.included, used: input.used, remaining, overage, overageRateCents: input.overageRateCents, estimatedOverageCents: Math.round(overage * input.overageRateCents), enabled: input.enabled, allowed, reason };
}

function subscriptionAccess(status: string | null, updatedAt: Date | null, now: Date) {
  if (status === "active" || status === "trialing") return { allowed: true, inGracePeriod: false, graceUntil: null as Date | null };
  const graceDays = Math.max(0, Math.min(14, Number(process.env.BILLING_GRACE_DAYS || 3)));
  const graceUntil = status === "past_due" && updatedAt ? new Date(updatedAt.getTime() + graceDays * 86_400_000) : null;
  return { allowed: Boolean(graceUntil && graceUntil > now), inGracePeriod: Boolean(graceUntil && graceUntil > now), graceUntil };
}

function monthPeriod(now: Date) {
  return { start: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)), end: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)) };
}

function inferPeriodStart(periodEnd: Date, fallback: Date) {
  const inferred = new Date(periodEnd);
  inferred.setUTCMonth(inferred.getUTCMonth() - 1);
  return inferred < periodEnd ? inferred : fallback;
}

function emptyEntitlements(start: Date, end: Date): BillingEntitlements {
  const feature = { included: 0, used: 0, remaining: 0, overage: 0, overageRateCents: 0, estimatedOverageCents: 0, enabled: false, allowed: !billingEnforcementEnabled(), reason: billingEnforcementEnabled() ? "Database non configurato" : null };
  return { enforcementEnabled: billingEnforcementEnabled(), planKey: null, planName: null, subscriptionStatus: null, paymentAllowed: false, inGracePeriod: false, graceUntil: null, periodStart: start.toISOString(), periodEnd: end.toISOString(), voice: { ...feature }, whatsapp: { ...feature } };
}
