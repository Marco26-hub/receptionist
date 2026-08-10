import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb, isDatabaseConfigured } from "../../db";
import { appointments, auditLogs, customers, leads, messages, opportunities, organizations, subscriptions } from "../../db/schema";
import { demoMetrics, demoOpportunities, demoOrganization } from "./demo-data";
import { rankOpportunities } from "./optimization";

export type DashboardOpportunity = (typeof demoOpportunities)[number];

export async function getDashboardData() {
  if (!isDatabaseConfigured()) return { organization: demoOrganization, metrics: demoMetrics, opportunities: demoOpportunities, mode: "demo" as const };
  const db = getDb();
  const organization = await db.query.organizations.findFirst({ orderBy: [desc(organizations.createdAt)] });
  if (!organization) return { organization: demoOrganization, metrics: demoMetrics, opportunities: demoOpportunities, mode: "empty" as const };

  const rows = await db.select({
    id: opportunities.id,
    customerId: customers.id,
    customerName: sql<string>`${customers.firstName} || ' ' || coalesce(${customers.lastName}, '')`,
    phone: customers.phone,
    type: opportunities.type,
    title: opportunities.title,
    reason: opportunities.reason,
    score: opportunities.score,
    estimatedValueCents: opportunities.estimatedValueCents,
    status: opportunities.status,
    message: messages.body,
  }).from(opportunities).leftJoin(customers, eq(opportunities.customerId, customers.id)).leftJoin(messages, eq(messages.opportunityId, opportunities.id)).where(and(eq(opportunities.organizationId, organization.id), inArray(opportunities.status, ["new", "drafted", "approved"]))).orderBy(desc(opportunities.score)).limit(30);

  const aggregate = await db.select({ potentialValueCents: sql<number>`coalesce(sum(${opportunities.estimatedValueCents}), 0)`, activeOpportunities: sql<number>`count(*)` }).from(opportunities).where(and(eq(opportunities.organizationId, organization.id), inArray(opportunities.status, ["new", "drafted", "approved"])));
  const toApprove = await db.select({ count: sql<number>`count(*)` }).from(messages).where(and(eq(messages.organizationId, organization.id), eq(messages.status, "draft")));

  return {
    organization,
    metrics: { potentialValueCents: Number(aggregate[0]?.potentialValueCents || 0), activeOpportunities: Number(aggregate[0]?.activeOpportunities || 0), emptySlots: rows.filter((row) => row.type === "empty_slot").length, messagesToApprove: Number(toApprove[0]?.count || 0), conversionRate: 0 },
    opportunities: rows.map((row) => ({ ...row, customerName: row.customerName?.trim() || "Cliente", phone: row.phone || "", message: row.message || "", status: row.status })),
    mode: "live" as const,
  };
}

export async function createLead(input: { centerName: string; contactName: string; email: string; phone: string | null; city: string | null; monthlyAppointments: string | null; source: string }) {
  if (!isDatabaseConfigured()) return { id: `demo-${Date.now()}`, demo: true };
  const [lead] = await getDb().insert(leads).values(input).returning({ id: leads.id });
  return { id: lead.id, demo: false };
}

export async function updateMessageStatus(input: { opportunityId: string; status: "approved" | "dismissed"; actorEmail: string }) {
  if (!isDatabaseConfigured()) return { ok: true, demo: true };
  const db = getDb();
  const [opportunity] = await db.select().from(opportunities).where(eq(opportunities.id, input.opportunityId)).limit(1);
  if (!opportunity) throw new Error("Opportunità non trovata");
  await db.transaction(async (transaction) => {
    await transaction.update(opportunities).set({ status: input.status === "approved" ? "approved" : "dismissed", updatedAt: new Date() }).where(eq(opportunities.id, input.opportunityId));
    if (input.status === "approved") await transaction.update(messages).set({ status: "approved", approvedAt: new Date() }).where(eq(messages.opportunityId, input.opportunityId));
    await transaction.insert(auditLogs).values({ organizationId: opportunity.organizationId, actorEmail: input.actorEmail, action: input.status, entityType: "opportunity", entityId: input.opportunityId });
  });
  return { ok: true, demo: false };
}

export async function saveGeneratedDraft(input: { opportunityId: string; organizationId: string; customerId: string; body: string }) {
  if (!isDatabaseConfigured()) return { id: `demo-message-${Date.now()}`, body: input.body };
  const db = getDb();
  const existing = await db.query.messages.findFirst({ where: eq(messages.opportunityId, input.opportunityId) });
  if (existing) {
    const [updated] = await db.update(messages).set({ body: input.body, status: "draft" }).where(eq(messages.id, existing.id)).returning();
    return updated;
  }
  const [created] = await db.insert(messages).values({ organizationId: input.organizationId, customerId: input.customerId, opportunityId: input.opportunityId, body: input.body }).returning();
  await db.update(opportunities).set({ status: "drafted", updatedAt: new Date() }).where(eq(opportunities.id, input.opportunityId));
  return created;
}

export async function getMessageForApprovedSend(opportunityId: string) {
  if (!isDatabaseConfigured()) {
    const item = demoOpportunities.find((opportunity) => opportunity.id === opportunityId);
    return item ? { messageId: item.id, to: item.phone, body: item.message, consent: true } : null;
  }
  const [row] = await getDb().select({ messageId: messages.id, to: customers.phone, body: messages.body, consent: customers.marketingConsent, blocked: customers.doNotContact }).from(messages).innerJoin(customers, eq(messages.customerId, customers.id)).where(eq(messages.opportunityId, opportunityId)).limit(1);
  if (!row || !row.consent || row.blocked) return null;
  return row;
}

export async function markMessageSent(input: { opportunityId: string; messageId: string; externalMessageId: string; demo: boolean }) {
  if (!isDatabaseConfigured()) return { ok: true, demo: true };
  const db = getDb(); await db.transaction(async (transaction) => { await transaction.update(messages).set({ status: "sent", externalMessageId: input.externalMessageId, sentAt: new Date() }).where(eq(messages.id, input.messageId)); await transaction.update(opportunities).set({ status: "sent", updatedAt: new Date() }).where(eq(opportunities.id, input.opportunityId)); });
  return { ok: true, demo: input.demo };
}

export async function runDailyOptimization() {
  if (!isDatabaseConfigured()) return { created: demoOpportunities.length, mode: "demo" as const };
  const db = getDb();
  const allOrganizations = await db.select().from(organizations);
  let created = 0;
  for (const organization of allOrganizations) {
    const eligibleCustomers = await db.select({ id: customers.id, firstName: customers.firstName, lastVisitAt: customers.lastVisitAt, lifetimeValueCents: customers.lifetimeValueCents, preferredServices: customers.preferredServices, marketingConsent: customers.marketingConsent, doNotContact: customers.doNotContact }).from(customers).where(eq(customers.organizationId, organization.id));
    const ranked = rankOpportunities(eligibleCustomers);
    for (const item of ranked) {
      const duplicate = await db.query.opportunities.findFirst({ where: and(eq(opportunities.customerId, item.customerId), eq(opportunities.type, item.type), inArray(opportunities.status, ["new", "drafted", "approved", "sent"])) });
      if (duplicate) continue;
      await db.insert(opportunities).values({ organizationId: organization.id, customerId: item.customerId, type: item.type, title: item.title, reason: item.reason, score: item.score, estimatedValueCents: item.estimatedValueCents, metadata: item.metadata });
      created += 1;
    }
    await db.insert(auditLogs).values({ organizationId: organization.id, action: "optimization.completed", entityType: "organization", entityId: organization.id, metadata: { created, algorithmVersion: "1.0.0" } });
  }
  return { created, mode: "live" as const };
}

export async function recordWhatsAppEvent(payload: { from?: string; body?: string; externalId?: string; status?: string; raw: Record<string, unknown> }) {
  if (!isDatabaseConfigured()) return { recorded: true, demo: true };
  const db = getDb();
  if (payload.status && payload.externalId) {
    const mapped = ["sent", "delivered", "read", "failed"].includes(payload.status) ? payload.status as "sent" | "delivered" | "read" | "failed" : "sent";
    await db.update(messages).set({ status: mapped, metadata: payload.raw }).where(eq(messages.externalMessageId, payload.externalId));
    return { recorded: true, demo: false };
  }
  if (!payload.from || !payload.body) return { recorded: false, demo: false };
  const normalized = payload.from.startsWith("+") ? payload.from : `+${payload.from}`;
  const customer = await db.query.customers.findFirst({ where: eq(customers.phone, normalized) });
  if (!customer) { await db.insert(auditLogs).values({ action: "whatsapp.unmatched_inbound", entityType: "message", entityId: payload.externalId, metadata: payload.raw }); return { recorded: false, demo: false }; }
  await db.insert(messages).values({ organizationId: customer.organizationId, customerId: customer.id, channel: "whatsapp", direction: "inbound", body: payload.body, status: "received", externalMessageId: payload.externalId, metadata: payload.raw });
  await db.insert(auditLogs).values({ organizationId: customer.organizationId, action: "whatsapp.inbound", entityType: "customer", entityId: customer.id });
  return { recorded: true, demo: false };
}

export async function updateSubscriptionFromStripe(event: { type: string; data: { object: Record<string, unknown> } }) {
  if (!isDatabaseConfigured()) return { updated: true, demo: true };
  const object = event.data.object;
  const subscriptionId = typeof object.id === "string" ? object.id : null;
  if (!subscriptionId) return { updated: false, demo: false };
  const status = typeof object.status === "string" ? object.status : event.type;
  const periodEnd = typeof object.current_period_end === "number" ? new Date(object.current_period_end * 1000) : null;
  await getDb().update(subscriptions).set({ status, currentPeriodEnd: periodEnd, updatedAt: new Date() }).where(eq(subscriptions.stripeSubscriptionId, subscriptionId));
  return { updated: true, demo: false };
}

export async function getAdminLists() {
  if (!isDatabaseConfigured()) return {
    customers: demoOpportunities.map((item, index) => ({ id: item.customerId, name: item.customerName, phone: item.phone, consent: true, lastVisit: `${72 + index * 18} giorni fa` })),
    appointments: [{ id: "apt-1", service: "Trattamento viso", customer: "Giulia B.", startsAt: "Oggi · 15:30", status: "Confermato" }, { id: "apt-2", service: "Laser gambe", customer: "Martina R.", startsAt: "Domani · 11:00", status: "Da confermare" }],
    messages: demoOpportunities.map((item) => ({ id: item.id, customer: item.customerName, body: item.message, status: item.status })), mode: "demo" as const,
  };
  const db = getDb(); const organization = await db.query.organizations.findFirst({ orderBy: [desc(organizations.createdAt)] });
  if (!organization) return { customers: [], appointments: [], messages: [], mode: "live" as const };
  const [customerRows, appointmentRows, messageRows] = await Promise.all([
    db.select({ id: customers.id, name: sql<string>`${customers.firstName} || ' ' || coalesce(${customers.lastName}, '')`, phone: customers.phone, consent: customers.marketingConsent, lastVisit: customers.lastVisitAt }).from(customers).where(eq(customers.organizationId, organization.id)).orderBy(desc(customers.lastVisitAt)).limit(100),
    db.select({ id: appointments.id, service: appointments.serviceName, customer: sql<string>`coalesce(${customers.firstName}, 'Cliente')`, startsAt: appointments.startsAt, status: appointments.status }).from(appointments).leftJoin(customers, eq(appointments.customerId, customers.id)).where(eq(appointments.organizationId, organization.id)).orderBy(appointments.startsAt).limit(100),
    db.select({ id: messages.id, customer: sql<string>`${customers.firstName} || ' ' || coalesce(${customers.lastName}, '')`, body: messages.body, status: messages.status }).from(messages).leftJoin(customers, eq(messages.customerId, customers.id)).where(eq(messages.organizationId, organization.id)).orderBy(desc(messages.createdAt)).limit(100),
  ]);
  return { customers: customerRows.map((row) => ({ ...row, lastVisit: row.lastVisit ? row.lastVisit.toLocaleDateString("it-IT") : "Mai" })), appointments: appointmentRows.map((row) => ({ ...row, startsAt: row.startsAt.toLocaleString("it-IT", { dateStyle: "short", timeStyle: "short" }) })), messages: messageRows, mode: "live" as const };
}
