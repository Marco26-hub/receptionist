import { and, asc, desc, eq, gt, gte, inArray, lt, lte, ne, sql } from "drizzle-orm";
import { getDb, isDatabaseConfigured } from "../../db";
import {
  appointments,
  auditLogs,
  customers,
  organizations,
  voiceAgents,
  voiceAgentVersions,
  voiceCalls,
  voiceTestRuns,
  type VoiceFaq,
  type VoiceService,
  type VoiceTranscriptTurn,
} from "../../db/schema";
import { normalizePhone } from "./security";
import { ValidationError } from "./validation";
import { defaultVoiceFaqs, defaultVoicePrompt, defaultVoiceServices, demoVoiceAgent, demoVoiceCalls, requiredVoiceScenarioIds, voiceScenarios } from "./voice-demo";

export type VoiceAgentInput = {
  name: string;
  category: string;
  language: string;
  greeting: string;
  systemPrompt: string;
  services: VoiceService[];
  faqs: VoiceFaq[];
  transferNumber: string | null;
  bookingEnabled: boolean;
  recordingEnabled: boolean;
  voiceId: string;
  retellAgentId: string | null;
  retellPhoneNumber: string | null;
};

function defaultGreeting(name: string) {
  return `Buongiorno, sono l’assistente virtuale di ${name}. Come posso aiutarti?`;
}

function agentSnapshot(agent: typeof voiceAgents.$inferSelect) {
  return {
    name: agent.name,
    category: agent.category,
    provider: agent.provider,
    model: agent.model,
    voiceId: agent.voiceId,
    language: agent.language,
    greeting: agent.greeting,
    systemPrompt: agent.systemPrompt,
    services: agent.services,
    faqs: agent.faqs,
    transferNumber: agent.transferNumber,
    bookingEnabled: agent.bookingEnabled,
    recordingEnabled: agent.recordingEnabled,
    retellAgentId: agent.retellAgentId,
    retellPhoneNumber: agent.retellPhoneNumber,
  };
}

export async function getVoiceAdminData(organizationId: string) {
  if (!isDatabaseConfigured()) {
    return {
      businessName: "AgendaPiena AI",
      agent: demoVoiceAgent,
      calls: demoVoiceCalls,
      tests: [],
      scenarios: voiceScenarios,
      requiredScenarioIds: requiredVoiceScenarioIds,
      integrations: { retell: false, ai: false, openrouter: false },
      mode: "demo" as const,
    };
  }

  const db = getDb();
  const organization = await db.query.organizations.findFirst({ where: eq(organizations.id, organizationId) });
  if (!organization) throw new ValidationError("Attività non trovata");
  let agent = await db.query.voiceAgents.findFirst({ where: eq(voiceAgents.organizationId, organizationId) });
  if (!agent) {
    [agent] = await db.insert(voiceAgents).values({
      organizationId,
      greeting: defaultGreeting(organization.name),
      systemPrompt: defaultVoicePrompt,
      services: defaultVoiceServices,
      faqs: defaultVoiceFaqs,
      transferNumber: process.env.LEGAL_PHONE_HREF || null,
    }).returning();
  }

  const [storedCalls, tests] = await Promise.all([
    db.select().from(voiceCalls).where(eq(voiceCalls.organizationId, organizationId)).orderBy(desc(voiceCalls.createdAt)).limit(30),
    db.select().from(voiceTestRuns).where(eq(voiceTestRuns.organizationId, organizationId)).orderBy(desc(voiceTestRuns.createdAt)).limit(20),
  ]);

  return {
    businessName: organization.name,
    agent,
    calls: storedCalls.map(({ recordingUrl, ...call }) => ({ ...call, hasRecording: Boolean(recordingUrl) })),
    tests,
    scenarios: voiceScenarios,
    requiredScenarioIds: requiredVoiceScenarioIds,
    integrations: {
      retell: Boolean(process.env.RETELL_API_KEY),
      ai: Boolean(process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY),
      openrouter: Boolean(process.env.OPENROUTER_API_KEY),
    },
    mode: "live" as const,
  };
}

export async function saveVoiceAgent(organizationId: string, input: VoiceAgentInput, actorEmail: string) {
  if (!isDatabaseConfigured()) return { ...demoVoiceAgent, ...input, status: "draft" as const, demo: true };
  const db = getDb();
  const current = await db.query.voiceAgents.findFirst({ where: eq(voiceAgents.organizationId, organizationId) });
  if (!current) throw new ValidationError("Assistente non trovato");
  const [saved] = await db.update(voiceAgents).set({
    ...input,
    transferNumber: input.transferNumber ? normalizePhone(input.transferNumber) : null,
    retellPhoneNumber: input.retellPhoneNumber ? normalizePhone(input.retellPhoneNumber) : null,
    status: current.status === "live" ? "ready" : current.status,
    testMode: current.status === "live" ? true : current.testMode,
    updatedAt: new Date(),
  }).where(and(eq(voiceAgents.id, current.id), eq(voiceAgents.organizationId, organizationId))).returning();
  await db.insert(auditLogs).values({ organizationId, actorEmail, action: "voice.agent.saved", entityType: "voice_agent", entityId: saved.id });
  return { ...saved, demo: false };
}

export async function saveGeneratedVoiceAgent(organizationId: string, input: Pick<VoiceAgentInput, "greeting" | "systemPrompt" | "faqs">, actorEmail: string) {
  if (!isDatabaseConfigured()) return { ...demoVoiceAgent, ...input, demo: true };
  const db = getDb();
  const [saved] = await db.update(voiceAgents).set({ ...input, status: "draft", testMode: true, updatedAt: new Date() })
    .where(eq(voiceAgents.organizationId, organizationId)).returning();
  if (!saved) throw new ValidationError("Assistente non trovato");
  await db.insert(auditLogs).values({ organizationId, actorEmail, action: "voice.agent.generated", entityType: "voice_agent", entityId: saved.id });
  return { ...saved, demo: false };
}

export async function recordVoiceTest(input: { organizationId: string; scenario: string; prompt: string; output: string; checks: Array<{ label: string; passed: boolean }>; actorEmail: string }) {
  const passed = input.checks.every((check) => check.passed);
  if (!isDatabaseConfigured()) return { id: `demo-test-${Date.now()}`, status: passed ? "passed" : "review", demo: true };
  const db = getDb();
  const agent = await db.query.voiceAgents.findFirst({ where: eq(voiceAgents.organizationId, input.organizationId) });
  if (!agent) throw new ValidationError("Assistente non trovato");
  const [test] = await db.insert(voiceTestRuns).values({
    organizationId: input.organizationId,
    agentId: agent.id,
    scenario: input.scenario,
    status: passed ? "passed" : "review",
    input: input.prompt,
    output: input.output,
    checks: input.checks,
    createdBy: input.actorEmail,
  }).returning();
  await db.update(voiceAgents).set({ status: passed ? "testing" : "draft", lastTestedAt: new Date(), testMode: true, updatedAt: new Date() }).where(eq(voiceAgents.id, agent.id));
  await db.insert(auditLogs).values({ organizationId: input.organizationId, actorEmail: input.actorEmail, action: "voice.test.completed", entityType: "voice_test", entityId: test.id, metadata: { scenario: input.scenario, passed } });
  return { ...test, demo: false };
}

export async function markVoiceAgentReady(organizationId: string, actorEmail: string) {
  if (!isDatabaseConfigured()) return { ...demoVoiceAgent, status: "ready" as const, demo: true };
  const db = getDb();
  const agent = await db.query.voiceAgents.findFirst({ where: eq(voiceAgents.organizationId, organizationId) });
  if (!agent) throw new ValidationError("Assistente non trovato");
  const passed = await db.select({ scenario: voiceTestRuns.scenario }).from(voiceTestRuns).where(and(eq(voiceTestRuns.agentId, agent.id), eq(voiceTestRuns.status, "passed")));
  const passedScenarios = new Set(passed.map((test) => test.scenario));
  const missing = requiredVoiceScenarioIds.filter((scenario) => !passedScenarios.has(scenario));
  if (missing.length) throw new ValidationError(`Completa le ${missing.length} prove essenziali mancanti prima di continuare`);
  const nextVersion = agent.publishedVersion + 1;
  await db.transaction(async (transaction) => {
    await transaction.insert(voiceAgentVersions).values({ organizationId, agentId: agent.id, version: nextVersion, configuration: agentSnapshot(agent), createdBy: actorEmail });
    await transaction.update(voiceAgents).set({ status: "ready", testMode: true, publishedVersion: nextVersion, publishedAt: new Date(), updatedAt: new Date() }).where(eq(voiceAgents.id, agent.id));
    await transaction.insert(auditLogs).values({ organizationId, actorEmail, action: "voice.agent.ready", entityType: "voice_agent", entityId: agent.id, metadata: { version: nextVersion } });
  });
  return { ok: true, status: "ready" as const, version: nextVersion, demo: false };
}

export async function setVoiceAgentLive(organizationId: string, actorEmail: string) {
  if (!isDatabaseConfigured()) throw new ValidationError("Il collegamento Retell è necessario per attivare il numero");
  const db = getDb();
  const agent = await db.query.voiceAgents.findFirst({ where: eq(voiceAgents.organizationId, organizationId) });
  if (!agent || agent.status !== "ready") throw new ValidationError("Segna prima l’assistente come pronto");
  if (!process.env.RETELL_API_KEY || !agent.retellAgentId || !agent.retellPhoneNumber) throw new ValidationError("Collega Retell, l’assistente e il numero prima di attivare");
  const [saved] = await db.update(voiceAgents).set({ status: "live", testMode: false, updatedAt: new Date() }).where(eq(voiceAgents.id, agent.id)).returning();
  await db.insert(auditLogs).values({ organizationId, actorEmail, action: "voice.agent.activated", entityType: "voice_agent", entityId: agent.id, metadata: { version: agent.publishedVersion } });
  return { ...saved, demo: false };
}

export async function pauseVoiceAgent(organizationId: string, actorEmail: string) {
  if (!isDatabaseConfigured()) return { ok: true, status: "paused" as const, demo: true };
  const db = getDb();
  const [agent] = await db.update(voiceAgents).set({ status: "paused", testMode: true, updatedAt: new Date() }).where(eq(voiceAgents.organizationId, organizationId)).returning();
  if (!agent) throw new ValidationError("Assistente non trovato");
  await db.insert(auditLogs).values({ organizationId, actorEmail, action: "voice.agent.paused", entityType: "voice_agent", entityId: agent.id });
  return { ok: true, status: agent.status, demo: false };
}

export async function findVoiceAgentByRetellId(retellAgentId: string) {
  if (!isDatabaseConfigured()) return null;
  return getDb().query.voiceAgents.findFirst({ where: eq(voiceAgents.retellAgentId, retellAgentId) });
}

export async function getVoiceCallRecording(organizationId: string, callId: string) {
  if (!isDatabaseConfigured()) return null;
  return getDb().query.voiceCalls.findFirst({
    columns: { recordingUrl: true, externalCallId: true },
    where: and(eq(voiceCalls.id, callId), eq(voiceCalls.organizationId, organizationId)),
  });
}

function normalizedTranscript(call: Record<string, unknown>): VoiceTranscriptTurn[] {
  const object = Array.isArray(call.transcript_object) ? call.transcript_object : [];
  return object.slice(0, 300).map((turn) => {
    const row = turn as Record<string, unknown>;
    return { role: row.role === "agent" ? "agent" : "customer", text: String(row.content || row.text || "").slice(0, 4000) };
  }).filter((turn) => turn.text) as VoiceTranscriptTurn[];
}

export async function recordRetellCallEvent(event: string, call: Record<string, unknown>) {
  if (!isDatabaseConfigured()) return { ok: true, demo: true };
  const externalCallId = String(call.call_id || "");
  const retellAgentId = String(call.agent_id || "");
  if (!externalCallId || !retellAgentId) throw new Error("Evento chiamata incompleto");
  const agent = await findVoiceAgentByRetellId(retellAgentId);
  if (!agent) throw new Error("Assistente non riconosciuto");
  const analysis = (call.call_analysis || {}) as Record<string, unknown>;
  const callCost = call.call_cost && typeof call.call_cost === "object" ? call.call_cost as Record<string, unknown> : {};
  const status = event === "call_started" ? "in_progress" : event === "call_ended" || event === "call_analyzed" ? "completed" : "registered";
  const values = {
    organizationId: agent.organizationId,
    agentId: agent.id,
    externalCallId,
    direction: String(call.direction || call.call_type || "inbound").includes("outbound") ? "outbound" : "inbound",
    mode: agent.testMode ? "test" : "live",
    status: status as "registered" | "in_progress" | "completed",
    fromNumber: call.from_number ? normalizePhone(String(call.from_number)) : null,
    toNumber: call.to_number ? normalizePhone(String(call.to_number)) : null,
    durationSeconds: Math.max(0, Math.round(Number(call.duration_ms || 0) / 1000)),
    costCents: Math.max(0, Math.round(Number(callCost.combined_cost || 0) * 100)),
    summary: analysis.call_summary ? String(analysis.call_summary).slice(0, 5000) : null,
    outcome: analysis.call_successful === true ? "completed" : call.disconnection_reason ? String(call.disconnection_reason).slice(0, 100) : null,
    transcript: normalizedTranscript(call),
    extractedData: analysis.custom_analysis_data && typeof analysis.custom_analysis_data === "object" ? analysis.custom_analysis_data as Record<string, unknown> : {},
    recordingUrl: agent.recordingEnabled && call.recording_url ? String(call.recording_url) : null,
    startedAt: call.start_timestamp ? new Date(Number(call.start_timestamp)) : null,
    endedAt: call.end_timestamp ? new Date(Number(call.end_timestamp)) : null,
    updatedAt: new Date(),
  };
  const existing = await getDb().query.voiceCalls.findFirst({ where: eq(voiceCalls.externalCallId, externalCallId) });
  if (existing) await getDb().update(voiceCalls).set(values).where(and(eq(voiceCalls.id, existing.id), eq(voiceCalls.organizationId, agent.organizationId)));
  else await getDb().insert(voiceCalls).values(values);
  return { ok: true, demo: false };
}

function zonedTimeToUtc(year: number, month: number, day: number, hour: number, minute: number, timeZone: string) {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(guess));
  const values = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, Number(part.value)]));
  const offset = Date.UTC(values.year, values.month - 1, values.day, values.hour, values.minute) - guess;
  return new Date(guess - offset);
}

export type VoiceSlot = { startsAt: string; label: string };

export async function getAvailableVoiceSlots(organizationId: string, durationMinutes: number, from = new Date()): Promise<VoiceSlot[]> {
  if (!isDatabaseConfigured()) return [
    { startsAt: new Date(from.getTime() + 86_400_000).toISOString(), label: "Domani alle 16:30" },
    { startsAt: new Date(from.getTime() + 2 * 86_400_000).toISOString(), label: "Dopodomani alle 11:00" },
  ];
  const db = getDb();
  const organization = await db.query.organizations.findFirst({ where: eq(organizations.id, organizationId) });
  if (!organization) throw new Error("Attività non trovata");
  const settings = organization.settings as { openingHour?: number; closingHour?: number; workingDays?: number[] };
  const opening = settings.openingHour ?? 9;
  const closing = settings.closingHour ?? 19;
  const workingDays = settings.workingDays || [1, 2, 3, 4, 5, 6];
  const horizon = new Date(from.getTime() + 14 * 86_400_000);
  const booked = await db.select().from(appointments).where(and(eq(appointments.organizationId, organizationId), gte(appointments.startsAt, from), lte(appointments.startsAt, horizon), inArray(appointments.status, ["confirmed", "pending"])));
  const todayParts = new Intl.DateTimeFormat("en-CA", { timeZone: organization.timezone, year: "numeric", month: "2-digit", day: "2-digit" })
    .formatToParts(from);
  const today = Object.fromEntries(todayParts.filter((part) => part.type !== "literal").map((part) => [part.type, Number(part.value)]));
  const slots: Date[] = [];
  for (let day = 0; day < 14 && slots.length < 4; day += 1) {
    const calendarDay = new Date(Date.UTC(today.year, today.month - 1, today.day + day));
    if (!workingDays.includes(calendarDay.getUTCDay())) continue;
    const cursor = zonedTimeToUtc(calendarDay.getUTCFullYear(), calendarDay.getUTCMonth() + 1, calendarDay.getUTCDate(), opening, 0, organization.timezone);
    const endOfDay = zonedTimeToUtc(calendarDay.getUTCFullYear(), calendarDay.getUTCMonth() + 1, calendarDay.getUTCDate(), closing, 0, organization.timezone);
    while (cursor.getTime() + durationMinutes * 60_000 <= endOfDay.getTime() && slots.length < 4) {
      const end = new Date(cursor.getTime() + durationMinutes * 60_000);
      if (cursor > from && !booked.some((appointment) => appointment.startsAt < end && appointment.endsAt > cursor)) slots.push(new Date(cursor));
      cursor.setTime(cursor.getTime() + 30 * 60_000);
    }
  }
  return slots.map((slot) => ({
    startsAt: slot.toISOString(),
    label: new Intl.DateTimeFormat("it-IT", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: organization.timezone }).format(slot),
  }));
}

export async function createVoiceBooking(input: { organizationId: string; firstName: string; phone: string; serviceName: string; startsAt: Date; durationMinutes: number; priceCents: number; confirmed: boolean; testMode: boolean; externalId?: string }) {
  if (!input.confirmed) throw new ValidationError("Serve la conferma esplicita della persona");
  if (input.testMode || !isDatabaseConfigured()) return { ok: true, demo: true, appointmentId: `test-${Date.now()}` };
  const db = getDb();
  if (input.externalId) {
    const existing = await db.query.appointments.findFirst({ where: and(eq(appointments.organizationId, input.organizationId), eq(appointments.externalId, input.externalId)) });
    if (existing) return { ok: true, demo: false, appointmentId: existing.id, existing: true };
  }
  const phone = normalizePhone(input.phone);
  let customer = await db.query.customers.findFirst({ where: and(eq(customers.organizationId, input.organizationId), eq(customers.phone, phone)) });
  if (!customer) [customer] = await db.insert(customers).values({ organizationId: input.organizationId, firstName: input.firstName, phone, marketingConsent: false }).returning();
  const endsAt = new Date(input.startsAt.getTime() + input.durationMinutes * 60_000);
  const [conflict] = await db.select({ count: sql<number>`count(*)` }).from(appointments).where(and(eq(appointments.organizationId, input.organizationId), inArray(appointments.status, ["confirmed", "pending"]), lt(appointments.startsAt, endsAt), gt(appointments.endsAt, input.startsAt)));
  if (Number(conflict?.count || 0) > 0) throw new ValidationError("Questo orario non è più disponibile");
  const values = { organizationId: input.organizationId, customerId: customer.id, externalId: input.externalId, serviceName: input.serviceName, startsAt: input.startsAt, endsAt, status: "confirmed", valueCents: input.priceCents };
  if (input.externalId) {
    const [appointment] = await db.insert(appointments).values(values).onConflictDoNothing({ target: [appointments.organizationId, appointments.externalId] }).returning({ id: appointments.id });
    if (appointment) return { ok: true, demo: false, appointmentId: appointment.id };
    const existing = await db.query.appointments.findFirst({ where: and(eq(appointments.organizationId, input.organizationId), eq(appointments.externalId, input.externalId)) });
    if (existing) return { ok: true, demo: false, appointmentId: existing.id, existing: true };
    throw new ValidationError("La prenotazione non è stata salvata. Riprova o coinvolgi lo staff");
  }
  const [appointment] = await db.insert(appointments).values(values).returning({ id: appointments.id });
  return { ok: true, demo: false, appointmentId: appointment.id };
}

export async function findUpcomingVoiceAppointments(input: { organizationId: string; firstName: string; phone: string; testMode: boolean }) {
  if (input.testMode || !isDatabaseConfigured()) return [{ id: "test-appointment", serviceName: "Pulizia viso", startsAt: new Date(Date.now() + 86_400_000).toISOString(), label: "Domani alle 16:30" }];
  const db = getDb();
  const phone = normalizePhone(input.phone);
  const [customer, organization] = await Promise.all([
    db.query.customers.findFirst({ where: and(eq(customers.organizationId, input.organizationId), eq(customers.phone, phone)) }),
    db.query.organizations.findFirst({ where: eq(organizations.id, input.organizationId) }),
  ]);
  if (!customer || !samePersonName(customer.firstName, input.firstName)) return [];
  const rows = await db.select().from(appointments).where(and(
    eq(appointments.organizationId, input.organizationId),
    eq(appointments.customerId, customer.id),
    gte(appointments.startsAt, new Date()),
    inArray(appointments.status, ["confirmed", "pending"]),
  )).orderBy(asc(appointments.startsAt)).limit(3);
  return rows.map((appointment) => ({
    id: appointment.id,
    serviceName: appointment.serviceName,
    startsAt: appointment.startsAt.toISOString(),
    label: new Intl.DateTimeFormat("it-IT", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: organization?.timezone || "Europe/Rome" }).format(appointment.startsAt),
  }));
}

export async function rescheduleVoiceAppointment(input: { organizationId: string; appointmentId: string; phone: string; startsAt: Date; confirmed: boolean; testMode: boolean }) {
  if (!input.confirmed) throw new ValidationError("Serve la conferma esplicita della persona");
  if (input.testMode || !isDatabaseConfigured()) return { ok: true, demo: true, appointmentId: input.appointmentId };
  const db = getDb();
  const customer = await db.query.customers.findFirst({ where: and(eq(customers.organizationId, input.organizationId), eq(customers.phone, normalizePhone(input.phone))) });
  if (!customer) throw new ValidationError("Appuntamento non trovato");
  const appointment = await db.query.appointments.findFirst({ where: and(eq(appointments.id, input.appointmentId), eq(appointments.organizationId, input.organizationId), eq(appointments.customerId, customer.id)) });
  if (!appointment || !["confirmed", "pending"].includes(appointment.status)) throw new ValidationError("Appuntamento non trovato o non modificabile");
  if (!Number.isFinite(input.startsAt.getTime()) || input.startsAt <= new Date()) throw new ValidationError("Nuovo orario non valido");
  const duration = appointment.endsAt.getTime() - appointment.startsAt.getTime();
  const available = await getAvailableVoiceSlots(input.organizationId, duration / 60_000);
  if (!available.some((slot) => Math.abs(new Date(slot.startsAt).getTime() - input.startsAt.getTime()) < 60_000)) throw new ValidationError("Scegli uno degli orari verificati come disponibili");
  const endsAt = new Date(input.startsAt.getTime() + duration);
  const [conflict] = await db.select({ count: sql<number>`count(*)` }).from(appointments).where(and(
    eq(appointments.organizationId, input.organizationId),
    ne(appointments.id, appointment.id),
    inArray(appointments.status, ["confirmed", "pending"]),
    lt(appointments.startsAt, endsAt),
    gt(appointments.endsAt, input.startsAt),
  ));
  if (Number(conflict?.count || 0) > 0) throw new ValidationError("Il nuovo orario non è più disponibile");
  await db.update(appointments).set({ startsAt: input.startsAt, endsAt }).where(and(eq(appointments.id, appointment.id), eq(appointments.organizationId, input.organizationId)));
  return { ok: true, demo: false, appointmentId: appointment.id };
}

export async function cancelVoiceAppointment(input: { organizationId: string; appointmentId: string; phone: string; confirmed: boolean; testMode: boolean }) {
  if (!input.confirmed) throw new ValidationError("Serve la conferma esplicita della persona");
  if (input.testMode || !isDatabaseConfigured()) return { ok: true, demo: true, appointmentId: input.appointmentId };
  const db = getDb();
  const customer = await db.query.customers.findFirst({ where: and(eq(customers.organizationId, input.organizationId), eq(customers.phone, normalizePhone(input.phone))) });
  if (!customer) throw new ValidationError("Appuntamento non trovato");
  const [appointment] = await db.update(appointments).set({ status: "cancelled" }).where(and(
    eq(appointments.id, input.appointmentId),
    eq(appointments.organizationId, input.organizationId),
    eq(appointments.customerId, customer.id),
    inArray(appointments.status, ["confirmed", "pending"]),
  )).returning({ id: appointments.id });
  if (!appointment) throw new ValidationError("Appuntamento non trovato o già annullato");
  return { ok: true, demo: false, appointmentId: appointment.id };
}

function samePersonName(stored: string, supplied: string) {
  const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("it");
  const expected = normalize(stored);
  const received = normalize(supplied);
  return Boolean(expected && received && (expected === received || received.startsWith(`${expected} `)));
}
