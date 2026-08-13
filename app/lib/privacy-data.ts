import { and, desc, eq, isNotNull, lt, ne, or, sql } from "drizzle-orm";
import { getDb, isDatabaseConfigured } from "../../db";
import {
  appointments,
  auditLogs,
  customers,
  dataRetentionPolicies,
  integrations,
  members,
  messages,
  opportunities,
  organizations,
  privacyRequests,
  subscriptions,
  voiceAgents,
  voiceAgentVersions,
  voiceCalls,
  voiceKnowledgeSources,
  voiceTestRuns,
} from "../../db/schema";

export const DEFAULT_RETENTION_POLICY = {
  messageContentDays: 365,
  voiceTranscriptDays: 180,
  recordingDays: 30,
  auditLogDays: 730,
};

const REDACTED_MESSAGE = "[contenuto eliminato per scadenza dei tempi di conservazione]";
const ERASED_MESSAGE = "[contenuto eliminato su richiesta del cliente]";

export type RetentionPolicyInput = typeof DEFAULT_RETENTION_POLICY;

export async function getPrivacyAdminData(organizationId: string) {
  if (!isDatabaseConfigured()) return { policy: DEFAULT_RETENTION_POLICY, customers: [], requests: [], lastRunAt: null, mode: "demo" as const };
  const db = getDb();
  const [policy, customerRows, requestRows] = await Promise.all([
    db.query.dataRetentionPolicies.findFirst({ where: eq(dataRetentionPolicies.organizationId, organizationId) }),
    db.select({ id: customers.id, firstName: customers.firstName, lastName: customers.lastName, phone: customers.phone, email: customers.email, doNotContact: customers.doNotContact }).from(customers).where(eq(customers.organizationId, organizationId)).orderBy(customers.firstName).limit(500),
    db.select({ id: privacyRequests.id, customerId: privacyRequests.customerId, requestType: privacyRequests.requestType, status: privacyRequests.status, requestedBy: privacyRequests.requestedBy, details: privacyRequests.details, completedAt: privacyRequests.completedAt, createdAt: privacyRequests.createdAt }).from(privacyRequests).where(eq(privacyRequests.organizationId, organizationId)).orderBy(desc(privacyRequests.createdAt)).limit(30),
  ]);
  return {
    policy: policy ? {
      messageContentDays: policy.messageContentDays,
      voiceTranscriptDays: policy.voiceTranscriptDays,
      recordingDays: policy.recordingDays,
      auditLogDays: policy.auditLogDays,
    } : DEFAULT_RETENTION_POLICY,
    customers: customerRows.map((customer) => ({ ...customer, name: `${customer.firstName} ${customer.lastName || ""}`.trim() })),
    requests: requestRows.map((request) => ({ ...request, completedAt: request.completedAt?.toISOString() || null, createdAt: request.createdAt.toISOString() })),
    lastRunAt: policy?.lastRunAt?.toISOString() || null,
    mode: "live" as const,
  };
}

export async function saveRetentionPolicy(input: RetentionPolicyInput & { organizationId: string; actorEmail: string }) {
  if (!isDatabaseConfigured()) return { ...input, mode: "demo" as const };
  const db = getDb();
  const values = {
    messageContentDays: input.messageContentDays,
    voiceTranscriptDays: input.voiceTranscriptDays,
    recordingDays: input.recordingDays,
    auditLogDays: input.auditLogDays,
    updatedBy: input.actorEmail,
    updatedAt: new Date(),
  };
  const [saved] = await db.insert(dataRetentionPolicies).values({ organizationId: input.organizationId, ...values }).onConflictDoUpdate({ target: dataRetentionPolicies.organizationId, set: values }).returning();
  await db.insert(auditLogs).values({ organizationId: input.organizationId, actorEmail: input.actorEmail, action: "privacy.retention.updated", entityType: "organization", entityId: input.organizationId, metadata: values });
  return { ...saved, mode: "live" as const };
}

async function recordPrivacyRequest(input: { organizationId: string; customerId?: string; type: string; actorEmail: string; details?: Record<string, unknown> }) {
  const [request] = await getDb().insert(privacyRequests).values({ organizationId: input.organizationId, customerId: input.customerId, requestType: input.type, requestedBy: input.actorEmail, details: input.details || {}, completedAt: new Date() }).returning({ id: privacyRequests.id });
  await getDb().insert(auditLogs).values({ organizationId: input.organizationId, actorEmail: input.actorEmail, action: `privacy.${input.type}.completed`, entityType: input.customerId ? "customer" : "organization", entityId: input.customerId || input.organizationId, metadata: { requestId: request.id } });
  return request.id;
}

export async function exportCustomerData(organizationId: string, customerId: string, actorEmail: string) {
  if (!isDatabaseConfigured()) throw new Error("Database non configurato");
  const db = getDb();
  const customer = await db.query.customers.findFirst({ where: and(eq(customers.id, customerId), eq(customers.organizationId, organizationId)) });
  if (!customer) throw new Error("Cliente non trovato in questa attività");
  const [appointmentRows, opportunityRows, messageRows, callRows] = await Promise.all([
    db.select().from(appointments).where(and(eq(appointments.organizationId, organizationId), eq(appointments.customerId, customerId))),
    db.select().from(opportunities).where(and(eq(opportunities.organizationId, organizationId), eq(opportunities.customerId, customerId))),
    db.select().from(messages).where(and(eq(messages.organizationId, organizationId), eq(messages.customerId, customerId))),
    db.select().from(voiceCalls).where(and(eq(voiceCalls.organizationId, organizationId), eq(voiceCalls.customerId, customerId))),
  ]);
  const requestId = await recordPrivacyRequest({ organizationId, customerId, type: "customer_export", actorEmail, details: { records: appointmentRows.length + opportunityRows.length + messageRows.length + callRows.length + 1 } });
  return { generatedAt: new Date().toISOString(), requestId, customer, appointments: appointmentRows, opportunities: opportunityRows, messages: messageRows, voiceCalls: callRows };
}

export async function exportOrganizationData(organizationId: string, actorEmail: string) {
  if (!isDatabaseConfigured()) throw new Error("Database non configurato");
  const db = getDb();
  const organization = await db.query.organizations.findFirst({ where: eq(organizations.id, organizationId) });
  if (!organization) throw new Error("Attività non trovata");
  const requestId = await recordPrivacyRequest({ organizationId, type: "organization_export", actorEmail });
  const [memberRows, customerRows, appointmentRows, opportunityRows, messageRows, integrationRows, subscriptionRows, agentRows, versionRows, knowledgeRows, callRows, testRows, auditRows] = await Promise.all([
    db.select().from(members).where(eq(members.organizationId, organizationId)),
    db.select().from(customers).where(eq(customers.organizationId, organizationId)),
    db.select().from(appointments).where(eq(appointments.organizationId, organizationId)),
    db.select().from(opportunities).where(eq(opportunities.organizationId, organizationId)),
    db.select().from(messages).where(eq(messages.organizationId, organizationId)),
    db.select({ id: integrations.id, provider: integrations.provider, status: integrations.status, metadata: integrations.metadata, updatedAt: integrations.updatedAt }).from(integrations).where(eq(integrations.organizationId, organizationId)),
    db.select().from(subscriptions).where(eq(subscriptions.organizationId, organizationId)),
    db.select().from(voiceAgents).where(eq(voiceAgents.organizationId, organizationId)),
    db.select().from(voiceAgentVersions).where(eq(voiceAgentVersions.organizationId, organizationId)),
    db.select().from(voiceKnowledgeSources).where(eq(voiceKnowledgeSources.organizationId, organizationId)),
    db.select().from(voiceCalls).where(eq(voiceCalls.organizationId, organizationId)),
    db.select().from(voiceTestRuns).where(eq(voiceTestRuns.organizationId, organizationId)),
    db.select().from(auditLogs).where(eq(auditLogs.organizationId, organizationId)),
  ]);
  return { generatedAt: new Date().toISOString(), requestId, organization, members: memberRows, customers: customerRows, appointments: appointmentRows, opportunities: opportunityRows, messages: messageRows, integrations: integrationRows, subscriptions: subscriptionRows, voiceAgents: agentRows, voiceAgentVersions: versionRows, voiceKnowledgeSources: knowledgeRows, voiceCalls: callRows, voiceTestRuns: testRows, auditLogs: auditRows };
}

export async function eraseCustomerData(organizationId: string, customerId: string, actorEmail: string) {
  if (!isDatabaseConfigured()) throw new Error("Database non configurato");
  const db = getDb();
  return db.transaction(async (transaction) => {
    const customer = await transaction.query.customers.findFirst({ where: and(eq(customers.id, customerId), eq(customers.organizationId, organizationId)) });
    if (!customer) throw new Error("Cliente non trovato in questa attività");
    if (customer.phone === `eliminato-${customerId}`) throw new Error("Questo cliente è già stato reso anonimo");
    const [messageRows, opportunityRows, callRows] = await Promise.all([
      transaction.update(messages).set({ body: ERASED_MESSAGE, externalMessageId: null, metadata: {}, status: "failed" }).where(and(eq(messages.organizationId, organizationId), eq(messages.customerId, customerId))).returning({ id: messages.id }),
      transaction.update(opportunities).set({ title: "Cliente anonimizzato", reason: "Dati rimossi su richiesta", metadata: {}, status: "dismissed", updatedAt: new Date() }).where(and(eq(opportunities.organizationId, organizationId), eq(opportunities.customerId, customerId))).returning({ id: opportunities.id }),
      transaction.update(voiceCalls).set({ fromNumber: null, toNumber: null, summary: null, transcript: [], extractedData: {}, recordingUrl: null, updatedAt: new Date() }).where(and(eq(voiceCalls.organizationId, organizationId), eq(voiceCalls.customerId, customerId))).returning({ id: voiceCalls.id }),
    ]);
    await transaction.update(auditLogs).set({ metadata: { personalDataRemoved: true } }).where(and(eq(auditLogs.organizationId, organizationId), eq(auditLogs.entityType, "customer"), eq(auditLogs.entityId, customerId)));
    await transaction.update(customers).set({ externalId: null, firstName: "Cliente eliminato", lastName: null, phone: `eliminato-${customerId}`, email: null, preferredServices: [], marketingConsent: false, consentRecordedAt: null, doNotContact: true, notes: null, updatedAt: new Date() }).where(and(eq(customers.id, customerId), eq(customers.organizationId, organizationId)));
    const [request] = await transaction.insert(privacyRequests).values({ organizationId, customerId, requestType: "customer_erasure", requestedBy: actorEmail, details: { messages: messageRows.length, opportunities: opportunityRows.length, voiceCalls: callRows.length }, completedAt: new Date() }).returning({ id: privacyRequests.id });
    await transaction.insert(auditLogs).values({ organizationId, actorEmail, action: "privacy.customer_erasure.completed", entityType: "customer", entityId: customerId, metadata: { requestId: request.id } });
    return { ok: true, requestId: request.id, affected: { messages: messageRows.length, opportunities: opportunityRows.length, voiceCalls: callRows.length } };
  });
}

function cutoff(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export async function runRetentionCleanup(targetOrganizationId?: string) {
  if (!isDatabaseConfigured()) return { organizations: 0, messages: 0, transcripts: 0, recordings: 0, auditLogs: 0, mode: "demo" as const };
  const db = getDb();
  const organizationRows = targetOrganizationId ? await db.select({ id: organizations.id }).from(organizations).where(eq(organizations.id, targetOrganizationId)) : await db.select({ id: organizations.id }).from(organizations);
  const totals = { organizations: organizationRows.length, messages: 0, transcripts: 0, recordings: 0, auditLogs: 0 };
  for (const organization of organizationRows) {
    const policy = await db.query.dataRetentionPolicies.findFirst({ where: eq(dataRetentionPolicies.organizationId, organization.id) });
    const rules = policy || DEFAULT_RETENTION_POLICY;
    await db.transaction(async (transaction) => {
      const redactedMessages = await transaction.update(messages).set({ body: REDACTED_MESSAGE, externalMessageId: null, metadata: {} }).where(and(eq(messages.organizationId, organization.id), lt(messages.createdAt, cutoff(rules.messageContentDays)), ne(messages.body, REDACTED_MESSAGE), ne(messages.body, ERASED_MESSAGE))).returning({ id: messages.id });
      const clearedRecordings = await transaction.update(voiceCalls).set({ recordingUrl: null, updatedAt: new Date() }).where(and(eq(voiceCalls.organizationId, organization.id), lt(voiceCalls.createdAt, cutoff(rules.recordingDays)), isNotNull(voiceCalls.recordingUrl))).returning({ id: voiceCalls.id });
      const clearedTranscripts = await transaction.update(voiceCalls).set({ fromNumber: null, toNumber: null, summary: null, transcript: [], extractedData: {}, updatedAt: new Date() }).where(and(eq(voiceCalls.organizationId, organization.id), lt(voiceCalls.createdAt, cutoff(rules.voiceTranscriptDays)), or(isNotNull(voiceCalls.fromNumber), isNotNull(voiceCalls.toNumber), isNotNull(voiceCalls.summary), sql`jsonb_array_length(${voiceCalls.transcript}) > 0`))).returning({ id: voiceCalls.id });
      const deletedAuditLogs = await transaction.delete(auditLogs).where(and(eq(auditLogs.organizationId, organization.id), lt(auditLogs.createdAt, cutoff(rules.auditLogDays)))).returning({ id: auditLogs.id });
      const counts = { messages: redactedMessages.length, transcripts: clearedTranscripts.length, recordings: clearedRecordings.length, auditLogs: deletedAuditLogs.length };
      totals.messages += counts.messages; totals.transcripts += counts.transcripts; totals.recordings += counts.recordings; totals.auditLogs += counts.auditLogs;
      await transaction.insert(dataRetentionPolicies).values({ organizationId: organization.id, ...DEFAULT_RETENTION_POLICY, lastRunAt: new Date() }).onConflictDoUpdate({ target: dataRetentionPolicies.organizationId, set: { lastRunAt: new Date() } });
      await transaction.insert(auditLogs).values({ organizationId: organization.id, action: "privacy.retention.completed", entityType: "organization", entityId: organization.id, metadata: counts });
    });
  }
  return { ...totals, mode: "live" as const };
}
