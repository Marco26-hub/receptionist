import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { getDb, isDatabaseConfigured } from "../../db";
import {
  appointments,
  auditLogs,
  customers,
  leads,
  members,
  messages,
  opportunities,
  organizations,
  subscriptions,
  voiceAgents,
} from "../../db/schema";
import { demoMetrics, demoOpportunities, demoOrganization } from "./demo-data";
import { estimateEmptySlotScore, rankOpportunities } from "./optimization";
import { normalizePhone } from "./security";
import { isStripePlanKey, stripeIsConfigured, stripePlans } from "./stripe";

const ACTIVE_OPPORTUNITY_STATUSES = ["new", "drafted", "approved"] as const;
const DAY_MS = 86_400_000;

export type DashboardOpportunity = (typeof demoOpportunities)[number];

export async function resolveAdminIdentity(email: string) {
  if (!isDatabaseConfigured()) return { organizationId: demoOrganization.id, memberId: null, role: "owner" as const };
  const row = await getDb().query.members.findFirst({
    where: and(eq(members.email, email), eq(members.active, true)),
    orderBy: [desc(members.createdAt)],
  });
  return row ? { organizationId: row.organizationId, memberId: row.id, role: row.role } : null;
}

export async function getTeamMembers(organizationId: string) {
  if (!isDatabaseConfigured()) return [];
  return getDb().select({ id: members.id, email: members.email, name: members.name, role: members.role, active: members.active, createdAt: members.createdAt }).from(members).where(eq(members.organizationId, organizationId)).orderBy(desc(members.createdAt));
}

export async function addTeamMember(input: { organizationId: string; email: string; name: string; role: "owner" | "manager" | "staff"; actorEmail: string }) {
  if (!isDatabaseConfigured()) throw new Error("Database non configurato");
  const [saved] = await getDb().insert(members).values({ organizationId: input.organizationId, email: input.email, name: input.name, role: input.role }).onConflictDoUpdate({ target: [members.organizationId, members.email], set: { name: input.name, role: input.role, active: true } }).returning();
  await getDb().insert(auditLogs).values({ organizationId: input.organizationId, actorEmail: input.actorEmail, action: "team.member.invited", entityType: "member", entityId: saved.id, metadata: { email: input.email, role: input.role } });
  return saved;
}

export async function updateTeamMember(input: { organizationId: string; memberId: string; active: boolean; role?: "owner" | "manager" | "staff"; actorEmail: string }) {
  if (!isDatabaseConfigured()) throw new Error("Database non configurato");
  const existing = await getDb().query.members.findFirst({ where: and(eq(members.id, input.memberId), eq(members.organizationId, input.organizationId)) });
  if (!existing) throw new Error("Utente non trovato");
  if (existing.email === input.actorEmail && !input.active) throw new Error("Non puoi disattivare il tuo account");
  const [saved] = await getDb().update(members).set({ active: input.active, role: input.role || existing.role }).where(and(eq(members.id, input.memberId), eq(members.organizationId, input.organizationId))).returning();
  await getDb().insert(auditLogs).values({ organizationId: input.organizationId, actorEmail: input.actorEmail, action: "team.member.updated", entityType: "member", entityId: saved.id, metadata: { active: saved.active, role: saved.role } });
  return saved;
}

export async function getOnboardingData(organizationId: string) {
  if (!isDatabaseConfigured()) return { completed: 0, total: 6, steps: [], mode: "demo" as const };
  const db = getDb();
  const [organization, customerCount, appointmentCount, memberCount, voiceAgent, subscription] = await Promise.all([
    db.query.organizations.findFirst({ where: eq(organizations.id, organizationId) }),
    db.select({ count: sql<number>`count(*)` }).from(customers).where(eq(customers.organizationId, organizationId)),
    db.select({ count: sql<number>`count(*)` }).from(appointments).where(eq(appointments.organizationId, organizationId)),
    db.select({ count: sql<number>`count(*)` }).from(members).where(and(eq(members.organizationId, organizationId), eq(members.active, true))),
    db.query.voiceAgents.findFirst({ where: eq(voiceAgents.organizationId, organizationId) }),
    db.query.subscriptions.findFirst({ where: eq(subscriptions.organizationId, organizationId), orderBy: [desc(subscriptions.updatedAt)] }),
  ]);
  if (!organization) throw new Error("Attività non trovata");
  const settings = organization.settings as { openingHour?: number; closingHour?: number; workingDays?: number[] };
  const steps = [
    { id: "business", title: "Dati e orari dell’attività", detail: "Nome, città, giorni, orari e valore medio.", href: "/admin/impostazioni", done: Boolean(organization.name && settings.openingHour !== undefined && settings.closingHour !== undefined) },
    { id: "team", title: "Persone autorizzate", detail: "Invita responsabili e collaboratori con il ruolo corretto.", href: "/admin/team", done: Number(memberCount[0]?.count || 0) > 0 },
    { id: "data", title: "Clienti e appuntamenti", detail: "Importa i dati necessari al motore di recupero.", href: "/admin/clienti", done: Number(customerCount[0]?.count || 0) > 0 && Number(appointmentCount[0]?.count || 0) > 0 },
    { id: "voice", title: "Assistente e conoscenze", detail: "Servizi, documenti, regole, voce e prove.", href: "/admin/voce", done: Boolean(voiceAgent && ["ready", "live"].includes(voiceAgent.status)) },
    { id: "channels", title: "Canali collegati", detail: "Collega almeno Voice oppure WhatsApp.", href: "/admin/impostazioni", done: Boolean((process.env.RETELL_API_KEY && voiceAgent?.retellAgentId) || (process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID)) },
    { id: "billing", title: "Piano e pagamenti", detail: "Attiva il piano e controlla la fatturazione.", href: "/admin/abbonamento", done: Boolean(subscription && ["active", "trialing"].includes(subscription.status)) },
  ];
  return { organization: { name: organization.name }, completed: steps.filter((step) => step.done).length, total: steps.length, steps, mode: "live" as const };
}

export async function getBillingData(organizationId: string) {
  if (!isDatabaseConfigured()) return { subscription: null, stripeConfigured: false, configuredPlans: [] as string[], mode: "demo" as const };
  const subscription = await getDb().query.subscriptions.findFirst({
    where: eq(subscriptions.organizationId, organizationId),
    orderBy: [desc(subscriptions.updatedAt)],
  });
  return {
    subscription: subscription ? {
      plan: subscription.plan,
      status: subscription.status,
      monthlyAmountCents: subscription.monthlyAmountCents,
      currentPeriodEnd: subscription.currentPeriodEnd,
      stripeCustomerId: subscription.stripeCustomerId,
    } : null,
    stripeConfigured: stripeIsConfigured(),
    configuredPlans: Object.keys(stripePlans).filter((key) => Boolean(process.env[stripePlans[key as keyof typeof stripePlans].recurringEnv]) || (key === "agenda_clienti" && process.env.STRIPE_PRICE_ID)),
    mode: "live" as const,
  };
}

export async function getBillingIdentity(organizationId: string) {
  if (!isDatabaseConfigured()) throw new Error("Database non configurato");
  const [organization, subscription] = await Promise.all([
    getDb().query.organizations.findFirst({ where: eq(organizations.id, organizationId) }),
    getDb().query.subscriptions.findFirst({ where: eq(subscriptions.organizationId, organizationId), orderBy: [desc(subscriptions.updatedAt)] }),
  ]);
  if (!organization) throw new Error("Attività non trovata");
  return { organizationName: organization.name, stripeCustomerId: subscription?.stripeCustomerId || null };
}

export async function getDashboardData(organizationId: string) {
  if (!isDatabaseConfigured()) return { organization: demoOrganization, metrics: demoMetrics, opportunities: demoOpportunities, mode: "demo" as const };
  const db = getDb();
  const organization = await db.query.organizations.findFirst({ where: eq(organizations.id, organizationId) });
  if (!organization) throw new Error("Attività non trovata");

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
  }).from(opportunities)
    .leftJoin(customers, eq(opportunities.customerId, customers.id))
    .leftJoin(messages, and(eq(messages.opportunityId, opportunities.id), eq(messages.direction, "outbound")))
    .where(and(eq(opportunities.organizationId, organizationId), inArray(opportunities.status, [...ACTIVE_OPPORTUNITY_STATUSES, "sent"])))
    .orderBy(desc(opportunities.score)).limit(50);

  const [aggregate] = await db.select({
    potentialValueCents: sql<number>`coalesce(sum(${opportunities.estimatedValueCents}), 0)`,
    activeOpportunities: sql<number>`count(*)`,
  }).from(opportunities).where(and(eq(opportunities.organizationId, organizationId), inArray(opportunities.status, [...ACTIVE_OPPORTUNITY_STATUSES])));
  const [toApprove] = await db.select({ count: sql<number>`count(*)` }).from(messages).where(and(eq(messages.organizationId, organizationId), eq(messages.status, "draft")));
  const [outcomes] = await db.select({
    sent: sql<number>`count(*) filter (where ${opportunities.status} in ('sent', 'converted'))`,
    converted: sql<number>`count(*) filter (where ${opportunities.status} = 'converted')`,
  }).from(opportunities).where(eq(opportunities.organizationId, organizationId));
  const sent = Number(outcomes?.sent || 0);

  return {
    organization,
    metrics: {
      potentialValueCents: Number(aggregate?.potentialValueCents || 0),
      activeOpportunities: Number(aggregate?.activeOpportunities || 0),
      emptySlots: rows.filter((row) => row.type === "empty_slot").length,
      messagesToApprove: Number(toApprove?.count || 0),
      conversionRate: sent ? Math.round((Number(outcomes?.converted || 0) / sent) * 100) : 0,
    },
    opportunities: rows.map((row) => ({ ...row, customerName: row.customerName?.trim() || "Cliente", phone: row.phone || "", message: row.message || "", status: row.status })),
    mode: "live" as const,
  };
}

export async function createLead(input: { centerName: string; contactName: string; email: string; phone: string | null; city: string | null; monthlyAppointments: string | null; source: string }) {
  if (!isDatabaseConfigured()) return { id: `demo-${Date.now()}`, demo: true };
  const [lead] = await getDb().insert(leads).values(input).returning({ id: leads.id });
  return { id: lead.id, demo: false };
}

export async function getOpportunityDraftContext(organizationId: string, opportunityId: string) {
  if (!isDatabaseConfigured()) {
    const item = demoOpportunities.find((opportunity) => opportunity.id === opportunityId);
    return item ? { opportunityId: item.id, organizationId: demoOrganization.id, customerId: item.customerId, firstName: item.customerName.split(" ")[0], reason: item.reason, service: undefined, toneOfVoice: demoOrganization.toneOfVoice, centerName: demoOrganization.name } : null;
  }
  const [row] = await getDb().select({
    opportunityId: opportunities.id,
    organizationId: opportunities.organizationId,
    customerId: customers.id,
    firstName: customers.firstName,
    reason: opportunities.reason,
    services: customers.preferredServices,
    toneOfVoice: organizations.toneOfVoice,
    centerName: organizations.name,
  }).from(opportunities)
    .innerJoin(customers, eq(opportunities.customerId, customers.id))
    .innerJoin(organizations, eq(opportunities.organizationId, organizations.id))
    .where(and(eq(opportunities.id, opportunityId), eq(opportunities.organizationId, organizationId))).limit(1);
  return row ? { ...row, service: row.services[0] } : null;
}

export async function saveGeneratedDraft(input: { opportunityId: string; organizationId: string; customerId: string; body: string }) {
  if (!isDatabaseConfigured()) return { id: `demo-message-${Date.now()}`, body: input.body };
  const db = getDb();
  const existing = await db.query.messages.findFirst({ where: and(eq(messages.opportunityId, input.opportunityId), eq(messages.organizationId, input.organizationId), eq(messages.direction, "outbound")) });
  if (existing) {
    const [updated] = await db.update(messages).set({ body: input.body, status: "draft" }).where(and(eq(messages.id, existing.id), eq(messages.organizationId, input.organizationId))).returning();
    return updated;
  }
  const [created] = await db.insert(messages).values({ organizationId: input.organizationId, customerId: input.customerId, opportunityId: input.opportunityId, body: input.body }).returning();
  await db.update(opportunities).set({ status: "drafted", updatedAt: new Date() }).where(and(eq(opportunities.id, input.opportunityId), eq(opportunities.organizationId, input.organizationId)));
  return created;
}

export async function dismissOpportunity(input: { organizationId: string; opportunityId: string; actorEmail: string }) {
  if (!isDatabaseConfigured()) return { ok: true, demo: true };
  const db = getDb();
  const [row] = await db.update(opportunities).set({ status: "dismissed", updatedAt: new Date() })
    .where(and(eq(opportunities.id, input.opportunityId), eq(opportunities.organizationId, input.organizationId))).returning({ id: opportunities.id });
  if (!row) throw new Error("Opportunità non trovata");
  await db.insert(auditLogs).values({ organizationId: input.organizationId, actorEmail: input.actorEmail, action: "opportunity.dismissed", entityType: "opportunity", entityId: input.opportunityId });
  return { ok: true, demo: false };
}

export async function prepareApprovedSend(input: { organizationId: string; opportunityId: string; body: string; actorEmail: string; memberId: string | null }) {
  if (!isDatabaseConfigured()) {
    const item = demoOpportunities.find((opportunity) => opportunity.id === input.opportunityId);
    return item ? { messageId: item.id, to: item.phone, body: input.body || item.message } : null;
  }
  const db = getDb();
  const [row] = await db.select({ customerId: customers.id, to: customers.phone, consent: customers.marketingConsent, blocked: customers.doNotContact })
    .from(opportunities).innerJoin(customers, eq(opportunities.customerId, customers.id))
    .where(and(eq(opportunities.id, input.opportunityId), eq(opportunities.organizationId, input.organizationId))).limit(1);
  if (!row) throw new Error("Opportunità non trovata");
  if (!row.consent || row.blocked) return null;
  const message = await db.transaction(async (transaction) => {
    const existing = await transaction.query.messages.findFirst({ where: and(eq(messages.opportunityId, input.opportunityId), eq(messages.direction, "outbound"), eq(messages.organizationId, input.organizationId)) });
    const [saved] = existing
      ? await transaction.update(messages).set({ body: input.body, status: "sending", approvedBy: input.memberId, approvedAt: new Date() }).where(eq(messages.id, existing.id)).returning()
      : await transaction.insert(messages).values({ organizationId: input.organizationId, customerId: row.customerId, opportunityId: input.opportunityId, body: input.body, status: "sending", approvedBy: input.memberId, approvedAt: new Date() }).returning();
    await transaction.update(opportunities).set({ status: "approved", updatedAt: new Date() }).where(eq(opportunities.id, input.opportunityId));
    await transaction.insert(auditLogs).values({ organizationId: input.organizationId, actorEmail: input.actorEmail, action: "message.approved", entityType: "message", entityId: saved.id });
    return saved;
  });
  return { messageId: message.id, to: row.to, body: message.body };
}

export async function markMessageSent(input: { organizationId: string; opportunityId: string; messageId: string; externalMessageId: string; demo: boolean }) {
  if (!isDatabaseConfigured()) return { ok: true, demo: true };
  const db = getDb();
  await db.transaction(async (transaction) => {
    await transaction.update(messages).set({ status: "sent", externalMessageId: input.externalMessageId, sentAt: new Date() }).where(and(eq(messages.id, input.messageId), eq(messages.organizationId, input.organizationId)));
    await transaction.update(opportunities).set({ status: "sent", updatedAt: new Date() }).where(and(eq(opportunities.id, input.opportunityId), eq(opportunities.organizationId, input.organizationId)));
  });
  return { ok: true, demo: input.demo };
}

export async function markMessageFailed(input: { organizationId: string; messageId: string; reason: string }) {
  if (!isDatabaseConfigured()) return;
  await getDb().update(messages).set({ status: "failed", metadata: { error: input.reason } }).where(and(eq(messages.id, input.messageId), eq(messages.organizationId, input.organizationId)));
}

export async function convertOpportunity(input: { organizationId: string; opportunityId: string; actorEmail: string; startsAt?: Date; serviceName?: string; valueCents?: number }) {
  if (!isDatabaseConfigured()) return { ok: true, demo: true };
  const db = getDb();
  const opportunity = await db.query.opportunities.findFirst({ where: and(eq(opportunities.id, input.opportunityId), eq(opportunities.organizationId, input.organizationId)) });
  if (!opportunity) throw new Error("Opportunità non trovata");
  await db.transaction(async (transaction) => {
    let appointmentId: string | undefined;
    if (input.startsAt && opportunity.customerId) {
      const [created] = await transaction.insert(appointments).values({ organizationId: input.organizationId, customerId: opportunity.customerId, serviceName: input.serviceName || "Appuntamento recuperato", startsAt: input.startsAt, endsAt: new Date(input.startsAt.getTime() + 60 * 60 * 1000), valueCents: input.valueCents ?? opportunity.estimatedValueCents, status: "confirmed" }).returning({ id: appointments.id });
      appointmentId = created.id;
    }
    await transaction.update(opportunities).set({ status: "converted", updatedAt: new Date(), metadata: { ...opportunity.metadata, convertedAt: new Date().toISOString(), appointmentId } }).where(eq(opportunities.id, input.opportunityId));
    await transaction.insert(auditLogs).values({ organizationId: input.organizationId, actorEmail: input.actorEmail, action: "opportunity.converted", entityType: "opportunity", entityId: input.opportunityId, metadata: { appointmentId } });
  });
  return { ok: true, demo: false };
}

export async function createCustomer(organizationId: string, input: { firstName: string; lastName: string | null; phone: string; email: string | null; lastVisitAt: Date | null; lifetimeValueCents: number; preferredServices: string[]; marketingConsent: boolean; notes: string | null }) {
  if (!isDatabaseConfigured()) return { id: `demo-customer-${Date.now()}`, demo: true };
  const [row] = await getDb().insert(customers).values({ organizationId, ...input, phone: normalizePhone(input.phone), consentRecordedAt: input.marketingConsent ? new Date() : null }).onConflictDoUpdate({ target: [customers.organizationId, customers.phone], set: { ...input, phone: normalizePhone(input.phone), consentRecordedAt: input.marketingConsent ? new Date() : null, updatedAt: new Date() } }).returning({ id: customers.id });
  return { id: row.id, demo: false };
}

export async function createAppointment(organizationId: string, input: { customerId: string | null; serviceName: string; startsAt: Date; endsAt: Date; valueCents: number; status: string }) {
  if (!isDatabaseConfigured()) return { id: `demo-appointment-${Date.now()}`, demo: true };
  if (input.customerId) {
    const owned = await getDb().query.customers.findFirst({ where: and(eq(customers.id, input.customerId), eq(customers.organizationId, organizationId)) });
    if (!owned) throw new Error("Cliente non trovato");
  }
  const [row] = await getDb().insert(appointments).values({ organizationId, ...input }).returning({ id: appointments.id });
  return { id: row.id, demo: false };
}

export async function getAdminLists(organizationId: string) {
  if (!isDatabaseConfigured()) return {
    customers: demoOpportunities.map((item, index) => ({ id: item.customerId, name: item.customerName, phone: item.phone, consent: true, lastVisit: `${72 + index * 18} giorni fa` })),
    appointments: [{ id: "apt-1", service: "Trattamento viso", customer: "Giulia B.", startsAt: "Oggi · 15:30", status: "Confermato" }, { id: "apt-2", service: "Laser gambe", customer: "Martina R.", startsAt: "Domani · 11:00", status: "Da confermare" }],
    messages: demoOpportunities.map((item) => ({ id: item.id, customer: item.customerName, body: item.message, status: item.status })), mode: "demo" as const,
  };
  const db = getDb();
  const [customerRows, appointmentRows, messageRows] = await Promise.all([
    db.select({ id: customers.id, name: sql<string>`${customers.firstName} || ' ' || coalesce(${customers.lastName}, '')`, phone: customers.phone, consent: customers.marketingConsent, lastVisit: customers.lastVisitAt }).from(customers).where(eq(customers.organizationId, organizationId)).orderBy(desc(customers.lastVisitAt)).limit(500),
    db.select({ id: appointments.id, service: appointments.serviceName, customer: sql<string>`coalesce(${customers.firstName}, 'Cliente')`, startsAt: appointments.startsAt, status: appointments.status }).from(appointments).leftJoin(customers, eq(appointments.customerId, customers.id)).where(eq(appointments.organizationId, organizationId)).orderBy(appointments.startsAt).limit(500),
    db.select({ id: messages.id, customer: sql<string>`${customers.firstName} || ' ' || coalesce(${customers.lastName}, '')`, body: messages.body, status: messages.status, direction: messages.direction }).from(messages).leftJoin(customers, eq(messages.customerId, customers.id)).where(eq(messages.organizationId, organizationId)).orderBy(desc(messages.createdAt)).limit(500),
  ]);
  return { customers: customerRows.map((row) => ({ ...row, name: row.name.trim(), lastVisit: row.lastVisit ? row.lastVisit.toLocaleDateString("it-IT") : "Mai" })), appointments: appointmentRows.map((row) => ({ ...row, startsAt: row.startsAt.toLocaleString("it-IT", { dateStyle: "short", timeStyle: "short" }) })), messages: messageRows, mode: "live" as const };
}

export async function getOrganizationSettings(organizationId: string) {
  if (!isDatabaseConfigured()) return { organization: demoOrganization, integrations: { database: false, ai: false, whatsapp: false, stripe: false }, mode: "demo" as const };
  const organization = await getDb().query.organizations.findFirst({ where: eq(organizations.id, organizationId) });
  if (!organization) throw new Error("Attività non trovata");
  return { organization, integrations: { database: true, ai: Boolean(process.env.OPENAI_API_KEY && process.env.AI_DRAFTS_ENABLED === "true"), whatsapp: Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_TEMPLATE_NAME), stripe: Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID && process.env.STRIPE_WEBHOOK_SECRET) }, mode: "live" as const };
}

export async function updateOrganizationSettings(organizationId: string, input: { name: string; city: string | null; toneOfVoice: string; averageTicketCents: number; settings: Record<string, unknown> }) {
  if (!isDatabaseConfigured()) return { ok: true, demo: true };
  const [row] = await getDb().update(organizations).set({ ...input, updatedAt: new Date() }).where(eq(organizations.id, organizationId)).returning({ id: organizations.id });
  if (!row) throw new Error("Attività non trovata");
  return { ok: true, demo: false };
}

export async function runDailyOptimization(targetOrganizationId?: string) {
  if (!isDatabaseConfigured()) return { created: demoOpportunities.length, mode: "demo" as const };
  const db = getDb();
  const allOrganizations = targetOrganizationId ? await db.select().from(organizations).where(eq(organizations.id, targetOrganizationId)) : await db.select().from(organizations);
  let totalCreated = 0;
  for (const organization of allOrganizations) {
    let organizationCreated = 0;
    const eligibleCustomers = await db.select({ id: customers.id, firstName: customers.firstName, lastVisitAt: customers.lastVisitAt, lifetimeValueCents: customers.lifetimeValueCents, preferredServices: customers.preferredServices, marketingConsent: customers.marketingConsent, doNotContact: customers.doNotContact }).from(customers).where(eq(customers.organizationId, organization.id));
    const ranked = rankOpportunities(eligibleCustomers, 40);
    for (const item of ranked) {
      if (await recentlySuggested(organization.id, item.customerId, item.type)) continue;
      const [createdOpportunity] = await db.insert(opportunities).values({ organizationId: organization.id, customerId: item.customerId, type: item.type, title: item.title, reason: item.reason, score: item.score, estimatedValueCents: item.estimatedValueCents, metadata: item.metadata, status: "drafted" }).returning({ id: opportunities.id });
      const customer = eligibleCustomers.find((candidate) => candidate.id === item.customerId)!;
      await db.insert(messages).values({ organizationId: organization.id, customerId: item.customerId, opportunityId: createdOpportunity.id, body: defaultDraft(customer.firstName, organization.name, customer.preferredServices[0]), status: "draft" });
      organizationCreated += 1;
    }
    organizationCreated += await createFollowUpOpportunities(organization.id, organization.name, eligibleCustomers);
    organizationCreated += await createEmptySlotOpportunities(organization, eligibleCustomers);
    totalCreated += organizationCreated;
    await db.insert(auditLogs).values({ organizationId: organization.id, action: "optimization.completed", entityType: "organization", entityId: organization.id, metadata: { created: organizationCreated, algorithmVersion: "2.0.0" } });
  }
  return { created: totalCreated, mode: "live" as const };
}

async function recentlySuggested(organizationId: string, customerId: string, type: "inactive_client" | "follow_up") {
  return getDb().query.opportunities.findFirst({ where: and(eq(opportunities.organizationId, organizationId), eq(opportunities.customerId, customerId), eq(opportunities.type, type), gte(opportunities.createdAt, new Date(Date.now() - 30 * DAY_MS))) });
}

async function createFollowUpOpportunities(organizationId: string, centerName: string, customerRows: Array<{ id: string; firstName: string; preferredServices: string[]; marketingConsent: boolean; doNotContact: boolean }>) {
  const db = getDb();
  const now = new Date();
  const completed = await db.select().from(appointments).where(and(eq(appointments.organizationId, organizationId), eq(appointments.status, "completed"), gte(appointments.startsAt, new Date(now.getTime() - 90 * DAY_MS)), lte(appointments.startsAt, new Date(now.getTime() - 14 * DAY_MS))));
  let created = 0;
  for (const appointment of completed) {
    const customer = customerRows.find((item) => item.id === appointment.customerId);
    if (!customer || !customer.marketingConsent || customer.doNotContact || await recentlySuggested(organizationId, customer.id, "follow_up")) continue;
    const future = await db.query.appointments.findFirst({ where: and(eq(appointments.organizationId, organizationId), eq(appointments.customerId, customer.id), gte(appointments.startsAt, now), inArray(appointments.status, ["confirmed", "pending"])) });
    if (future) continue;
    const [opportunity] = await db.insert(opportunities).values({ organizationId, customerId: customer.id, type: "follow_up", title: `Programma il controllo di ${customer.firstName}`, reason: `${appointment.serviceName}: nessun prossimo appuntamento`, score: 76, estimatedValueCents: appointment.valueCents, status: "drafted", metadata: { sourceAppointmentId: appointment.id, algorithmVersion: "2.0.0" } }).returning({ id: opportunities.id });
    await db.insert(messages).values({ organizationId, customerId: customer.id, opportunityId: opportunity.id, body: defaultDraft(customer.firstName, centerName, appointment.serviceName), status: "draft" });
    created += 1;
  }
  return created;
}

async function createEmptySlotOpportunities(organization: typeof organizations.$inferSelect, customerRows: Array<{ id: string; firstName: string; lastVisitAt: Date | null; lifetimeValueCents: number; preferredServices: string[]; marketingConsent: boolean; doNotContact: boolean }>) {
  const settings = organization.settings as { openingHour?: number; closingHour?: number; slotMinutes?: number; workingDays?: number[] };
  const openingHour = Math.max(0, Math.min(23, Number(settings.openingHour ?? 9)));
  const closingHour = Math.max(openingHour + 1, Math.min(24, Number(settings.closingHour ?? 19)));
  const slotMinutes = Math.max(30, Math.min(240, Number(settings.slotMinutes ?? 60)));
  const workingDays = Array.isArray(settings.workingDays) ? settings.workingDays : [1, 2, 3, 4, 5, 6];
  const now = new Date();
  const horizon = new Date(now.getTime() + 7 * DAY_MS);
  const [activeSlots] = await getDb().select({ count: sql<number>`count(*)` }).from(opportunities).where(and(
    eq(opportunities.organizationId, organization.id),
    eq(opportunities.type, "empty_slot"),
    inArray(opportunities.status, [...ACTIVE_OPPORTUNITY_STATUSES, "sent"]),
    gte(opportunities.recommendedAt, now),
    lte(opportunities.recommendedAt, horizon),
  ));
  const remainingSlots = Math.max(0, 5 - Number(activeSlots?.count || 0));
  if (!remainingSlots) return 0;
  const booked = await getDb().select().from(appointments).where(and(eq(appointments.organizationId, organization.id), gte(appointments.startsAt, now), lte(appointments.startsAt, horizon), inArray(appointments.status, ["confirmed", "pending"])));
  const candidates = customerRows.filter((item) => item.marketingConsent && !item.doNotContact && item.lastVisitAt).sort((a, b) => b.lifetimeValueCents - a.lifetimeValueCents);
  let created = 0;
  for (let day = 1; day <= 7 && created < remainingSlots; day += 1) {
    const date = new Date(now); date.setDate(now.getDate() + day); date.setHours(openingHour, 0, 0, 0);
    if (!workingDays.includes(date.getDay())) continue;
    const close = new Date(date); close.setHours(closingHour, 0, 0, 0);
    for (let slot = new Date(date); slot.getTime() + slotMinutes * 60_000 <= close.getTime() && created < remainingSlots; slot = new Date(slot.getTime() + slotMinutes * 60_000)) {
      const slotEnd = new Date(slot.getTime() + slotMinutes * 60_000);
      if (booked.some((appointment) => appointment.startsAt < slotEnd && appointment.endsAt > slot)) continue;
      const customer = candidates[(day + created) % Math.max(1, candidates.length)];
      if (!customer) return created;
      const duplicate = await getDb().query.opportunities.findFirst({ where: and(eq(opportunities.organizationId, organization.id), eq(opportunities.type, "empty_slot"), eq(opportunities.recommendedAt, slot)) });
      if (duplicate) continue;
      const service = customer.preferredServices[0] || "trattamento preferito";
      const value = organization.averageTicketCents;
      const [opportunity] = await getDb().insert(opportunities).values({ organizationId: organization.id, customerId: customer.id, type: "empty_slot", title: `Riempi lo spazio di ${slot.toLocaleDateString("it-IT", { weekday: "long" })}`, reason: `${slot.toLocaleString("it-IT", { dateStyle: "short", timeStyle: "short" })} · compatibile con ${service}`, score: estimateEmptySlotScore({ hoursUntilSlot: (slot.getTime() - now.getTime()) / 3_600_000, matchingCustomers: candidates.length, valueCents: value }), estimatedValueCents: value, recommendedAt: slot, status: "drafted", metadata: { slotEndsAt: slotEnd.toISOString(), service, algorithmVersion: "2.0.0" } }).returning({ id: opportunities.id });
      await getDb().insert(messages).values({ organizationId: organization.id, customerId: customer.id, opportunityId: opportunity.id, body: `Ciao ${customer.firstName}, si è liberato uno spazio ${slot.toLocaleString("it-IT", { weekday: "long", hour: "2-digit", minute: "2-digit" })} per ${service}. Ti farebbe comodo? ${organization.name}`, status: "draft" });
      created += 1;
    }
  }
  return created;
}

function defaultDraft(firstName: string, centerName: string, service?: string) {
  return `Ciao ${firstName}, è da un po' che non ci vediamo${service ? ` per ${service}` : ""}. Se ti fa piacere, possiamo trovare con calma il momento più comodo per te. ${centerName}`;
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
  if (payload.externalId && await db.query.messages.findFirst({ where: eq(messages.externalMessageId, payload.externalId) })) return { recorded: true, demo: false };
  const normalized = normalizePhone(payload.from);
  const customer = await db.query.customers.findFirst({ where: eq(customers.phone, normalized), orderBy: [desc(customers.updatedAt)] });
  if (!customer) {
    await db.insert(auditLogs).values({ action: "whatsapp.unmatched_inbound", entityType: "message", entityId: payload.externalId, metadata: payload.raw });
    return { recorded: false, demo: false };
  }
  await db.transaction(async (transaction) => {
    await transaction.insert(messages).values({ organizationId: customer.organizationId, customerId: customer.id, channel: "whatsapp", direction: "inbound", body: payload.body!, status: "received", externalMessageId: payload.externalId, metadata: payload.raw });
    const lastOutbound = await transaction.query.messages.findFirst({ where: and(eq(messages.organizationId, customer.organizationId), eq(messages.customerId, customer.id), eq(messages.direction, "outbound")), orderBy: [desc(messages.createdAt)] });
    if (lastOutbound) {
      await transaction.update(messages).set({ status: "replied" }).where(eq(messages.id, lastOutbound.id));
      if (lastOutbound.opportunityId) await transaction.update(opportunities).set({ updatedAt: new Date(), metadata: sql`${opportunities.metadata} || ${JSON.stringify({ repliedAt: new Date().toISOString() })}::jsonb` }).where(eq(opportunities.id, lastOutbound.opportunityId));
    }
    await transaction.insert(auditLogs).values({ organizationId: customer.organizationId, action: "whatsapp.inbound", entityType: "customer", entityId: customer.id });
  });
  return { recorded: true, demo: false };
}

export async function updateSubscriptionFromStripe(event: { id?: string; type: string; data: { object: Record<string, unknown> } }) {
  if (!isDatabaseConfigured()) return { updated: true, demo: true };
  const object = event.data.object;
  const metadata = object.metadata && typeof object.metadata === "object" ? object.metadata as Record<string, unknown> : {};
  const isCheckout = event.type.startsWith("checkout.session.");
  const subscriptionId = isCheckout
    ? (typeof object.subscription === "string" ? object.subscription : null)
    : (typeof object.id === "string" ? object.id : null);
  const customerId = typeof object.customer === "string" ? object.customer : null;
  let organizationId = typeof object.client_reference_id === "string" ? object.client_reference_id : typeof metadata.organization_id === "string" ? metadata.organization_id : null;
  let existing = subscriptionId ? await getDb().query.subscriptions.findFirst({ where: eq(subscriptions.stripeSubscriptionId, subscriptionId) }) : null;
  if (!existing && customerId) existing = await getDb().query.subscriptions.findFirst({ where: eq(subscriptions.stripeCustomerId, customerId), orderBy: [desc(subscriptions.updatedAt)] });
  organizationId ||= existing?.organizationId || null;
  if (!organizationId || !subscriptionId) return { updated: false, demo: false };

  const requestedPlan = typeof metadata.plan_key === "string" && isStripePlanKey(metadata.plan_key) ? metadata.plan_key : null;
  const plan = requestedPlan || (existing?.plan && isStripePlanKey(existing.plan) ? existing.plan : "agenda_clienti");
  const items = object.items && typeof object.items === "object" ? object.items as { data?: Array<{ price?: { unit_amount?: number } }> } : null;
  const stripeAmount = items?.data?.[0]?.price?.unit_amount;
  const monthlyAmountCents = typeof stripeAmount === "number" ? stripeAmount : stripePlans[plan].monthlyAmountCents;
  const status = isCheckout
    ? (object.payment_status === "paid" || object.payment_status === "no_payment_required" ? "active" : "incomplete")
    : (typeof object.status === "string" ? object.status : existing?.status || "incomplete");
  const periodEnd = typeof object.current_period_end === "number" ? new Date(object.current_period_end * 1000) : null;
  const values = { organizationId, stripeCustomerId: customerId || existing?.stripeCustomerId || null, stripeSubscriptionId: subscriptionId, status, plan, monthlyAmountCents, currentPeriodEnd: periodEnd || existing?.currentPeriodEnd || null, updatedAt: new Date() };
  if (existing) await getDb().update(subscriptions).set(values).where(eq(subscriptions.id, existing.id));
  else await getDb().insert(subscriptions).values(values);
  await getDb().insert(auditLogs).values({ organizationId, action: `stripe.${event.type}`, entityType: "subscription", entityId: subscriptionId, metadata: { stripeEventId: event.id, status, plan } });
  return { updated: true, demo: false };
}
