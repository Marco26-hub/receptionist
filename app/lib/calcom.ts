import { and, eq } from "drizzle-orm";
import { getDb, isDatabaseConfigured } from "../../db";
import { auditLogs, integrations } from "../../db/schema";
import { decryptIntegrationConfig, encryptIntegrationConfig, integrationEncryptionReady } from "./integration-crypto";
import { ValidationError } from "./validation";

const PROVIDER = "calcom";
const API_URL = "https://api.cal.com/v2";

type CalcomConfig = { apiKey: string; eventTypeId: number };
type CalcomMetadata = { accountName?: string; accountEmail?: string; eventTypeId?: number; lastVerifiedAt?: string; lastSuccessAt?: string; lastError?: string; lastErrorAt?: string };
type CalcomResponse<T> = { status?: string; data?: T; error?: { message?: string }; message?: string };

export class CalcomError extends Error {}

function cleanProviderError(payload: unknown, status: number) {
  const body = payload && typeof payload === "object" ? payload as CalcomResponse<unknown> : null;
  const message = body?.error?.message || body?.message;
  return typeof message === "string" && message.length < 240 ? message : `Cal.com ha risposto con errore ${status}`;
}

async function calcomFetch<T>(path: string, apiKey: string, init: RequestInit = {}, version = "2024-08-13") {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(`${API_URL}${path}`, {
        ...init,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "cal-api-version": version,
          ...(init.body ? { "Content-Type": "application/json" } : {}),
          ...init.headers,
        },
        signal: AbortSignal.timeout(9_000),
        cache: "no-store",
      });
      const payload = await response.json().catch(() => ({})) as CalcomResponse<T>;
      if (response.ok) return payload.data as T;
      if (response.status !== 429 && response.status < 500) throw new CalcomError(cleanProviderError(payload, response.status));
      lastError = new CalcomError(cleanProviderError(payload, response.status));
    } catch (error) {
      if (error instanceof CalcomError && attempt === 0 && !/errore (429|5\d\d)/.test(error.message)) throw error;
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 300 * 2 ** attempt));
  }
  throw lastError instanceof CalcomError ? lastError : new CalcomError("Cal.com non è raggiungibile in questo momento");
}

async function integrationRow(organizationId: string) {
  if (!isDatabaseConfigured()) return null;
  return getDb().query.integrations.findFirst({ where: and(eq(integrations.organizationId, organizationId), eq(integrations.provider, PROVIDER)) });
}

async function activeConfig(organizationId: string) {
  const row = await integrationRow(organizationId);
  if (!row || row.status !== "connected" || !row.encryptedConfig) return null;
  try {
    return { row, config: decryptIntegrationConfig<CalcomConfig>(row.encryptedConfig) };
  } catch {
    throw new CalcomError("Il collegamento Cal.com non può essere letto. Ricollegalo dalle impostazioni");
  }
}

async function updateMetadata(organizationId: string, values: CalcomMetadata) {
  if (!isDatabaseConfigured()) return;
  const row = await integrationRow(organizationId);
  if (!row) return;
  await getDb().update(integrations).set({ metadata: { ...(row.metadata as CalcomMetadata), ...values }, updatedAt: new Date() }).where(eq(integrations.id, row.id));
}

async function recordError(organizationId: string, error: unknown) {
  const message = error instanceof Error ? error.message : "Errore calendario sconosciuto";
  await updateMetadata(organizationId, { lastError: message.slice(0, 240), lastErrorAt: new Date().toISOString() });
}

async function recordSuccess(organizationId: string) {
  await updateMetadata(organizationId, { lastSuccessAt: new Date().toISOString(), lastError: undefined, lastErrorAt: undefined });
}

export async function getCalcomAdminStatus(organizationId: string) {
  if (!isDatabaseConfigured()) return { connected: false, encryptionReady: integrationEncryptionReady(), eventTypeId: null, account: null, lastVerifiedAt: null, lastSuccessAt: null, lastError: "Database non collegato" };
  const row = await integrationRow(organizationId);
  const metadata = (row?.metadata || {}) as CalcomMetadata;
  return {
    connected: row?.status === "connected" && Boolean(row.encryptedConfig),
    encryptionReady: integrationEncryptionReady(),
    eventTypeId: typeof metadata.eventTypeId === "number" ? metadata.eventTypeId : null,
    account: metadata.accountName || metadata.accountEmail || null,
    lastVerifiedAt: metadata.lastVerifiedAt || null,
    lastSuccessAt: metadata.lastSuccessAt || null,
    lastError: metadata.lastError || null,
  };
}

export async function connectCalcom(input: { organizationId: string; apiKey: string; eventTypeId: number; actorEmail: string }) {
  if (!isDatabaseConfigured()) throw new ValidationError("Prima collega il database");
  if (!integrationEncryptionReady()) throw new ValidationError("Manca la chiave di sicurezza delle integrazioni");
  if (!/^cal_(live_)?[A-Za-z0-9_-]+$/.test(input.apiKey)) throw new ValidationError("La chiave Cal.com non sembra valida");
  if (!Number.isInteger(input.eventTypeId) || input.eventTypeId <= 0) throw new ValidationError("Inserisci l’ID numerico del tipo di appuntamento");

  let profile: { name?: string; email?: string; username?: string };
  try {
    profile = await calcomFetch("/me", input.apiKey);
    const start = new Date();
    const end = new Date(start.getTime() + 7 * 86_400_000);
    const query = new URLSearchParams({ eventTypeId: String(input.eventTypeId), start: start.toISOString(), end: end.toISOString(), timeZone: "Europe/Rome" });
    await calcomFetch(`/slots?${query}`, input.apiKey, {}, "2024-09-04");
  } catch (error) {
    throw new ValidationError(error instanceof Error ? `Collegamento non riuscito: ${error.message}` : "Collegamento Cal.com non riuscito");
  }

  const metadata: CalcomMetadata = { accountName: profile.name || profile.username, accountEmail: profile.email, eventTypeId: input.eventTypeId, lastVerifiedAt: new Date().toISOString(), lastSuccessAt: new Date().toISOString() };
  await getDb().insert(integrations).values({ organizationId: input.organizationId, provider: PROVIDER, status: "connected", encryptedConfig: encryptIntegrationConfig({ apiKey: input.apiKey, eventTypeId: input.eventTypeId }), metadata })
    .onConflictDoUpdate({ target: [integrations.organizationId, integrations.provider], set: { status: "connected", encryptedConfig: encryptIntegrationConfig({ apiKey: input.apiKey, eventTypeId: input.eventTypeId }), metadata, updatedAt: new Date() } });
  await getDb().insert(auditLogs).values({ organizationId: input.organizationId, actorEmail: input.actorEmail, action: "calendar.calcom.connected", entityType: "integration", metadata: { eventTypeId: input.eventTypeId, accountEmail: profile.email } });
  return getCalcomAdminStatus(input.organizationId);
}

export async function disconnectCalcom(organizationId: string, actorEmail: string) {
  if (!isDatabaseConfigured()) return { ok: true };
  await getDb().update(integrations).set({ status: "disconnected", encryptedConfig: null, metadata: {}, updatedAt: new Date() }).where(and(eq(integrations.organizationId, organizationId), eq(integrations.provider, PROVIDER)));
  await getDb().insert(auditLogs).values({ organizationId, actorEmail, action: "calendar.calcom.disconnected", entityType: "integration" });
  return { ok: true };
}

function flattenSlots(data: unknown) {
  const root = data && typeof data === "object" ? data as Record<string, unknown> : {};
  const source = root.slots && typeof root.slots === "object" ? root.slots as Record<string, unknown> : root;
  const values: Date[] = [];
  for (const rows of Object.values(source)) {
    if (!Array.isArray(rows)) continue;
    for (const row of rows) {
      const raw = typeof row === "string" ? row : row && typeof row === "object" ? String((row as Record<string, unknown>).start || (row as Record<string, unknown>).time || "") : "";
      const date = new Date(raw);
      if (Number.isFinite(date.getTime())) values.push(date);
    }
  }
  return values.sort((left, right) => left.getTime() - right.getTime());
}

export async function getCalcomSlots(organizationId: string, input: { from: Date; until: Date; durationMinutes: number; timeZone: string }) {
  const active = await activeConfig(organizationId);
  if (!active) return null;
  try {
    const query = new URLSearchParams({ eventTypeId: String(active.config.eventTypeId), start: input.from.toISOString(), end: input.until.toISOString(), timeZone: input.timeZone, duration: String(input.durationMinutes) });
    const data = await calcomFetch<unknown>(`/slots?${query}`, active.config.apiKey, {}, "2024-09-04");
    await recordSuccess(organizationId);
    return flattenSlots(data).filter((slot) => slot > input.from && slot < input.until);
  } catch (error) {
    await recordError(organizationId, error);
    throw error;
  }
}

export async function createCalcomBooking(organizationId: string, input: { startsAt: Date; durationMinutes: number; firstName: string; phone: string; serviceName: string; timeZone: string }) {
  const active = await activeConfig(organizationId);
  if (!active) return null;
  try {
    const data = await calcomFetch<{ uid?: string }>("/bookings", active.config.apiKey, {
      method: "POST",
      body: JSON.stringify({
        start: input.startsAt.toISOString(),
        eventTypeId: active.config.eventTypeId,
        lengthInMinutes: input.durationMinutes,
        attendee: { name: input.firstName, phoneNumber: input.phone, timeZone: input.timeZone, language: "it" },
        metadata: { source: "agendapiena", service: input.serviceName.slice(0, 120) },
      }),
    }, "2026-02-25");
    if (!data?.uid) throw new CalcomError("Cal.com non ha restituito il codice della prenotazione");
    await recordSuccess(organizationId);
    return data.uid;
  } catch (error) {
    await recordError(organizationId, error);
    throw error;
  }
}

export async function rescheduleCalcomBooking(organizationId: string, bookingUid: string, startsAt: Date) {
  const active = await activeConfig(organizationId);
  if (!active) throw new CalcomError("Cal.com non è più collegato: appuntamento non modificato");
  try {
    const data = await calcomFetch<{ uid?: string }>(`/bookings/${encodeURIComponent(bookingUid)}/reschedule`, active.config.apiKey, { method: "POST", body: JSON.stringify({ start: startsAt.toISOString(), reschedulingReason: "Richiesta telefonica del cliente" }) }, "2024-08-13");
    await recordSuccess(organizationId);
    return data?.uid || bookingUid;
  } catch (error) {
    await recordError(organizationId, error);
    throw error;
  }
}

export async function cancelCalcomBooking(organizationId: string, bookingUid: string) {
  const active = await activeConfig(organizationId);
  if (!active) throw new CalcomError("Cal.com non è più collegato: appuntamento non annullato");
  try {
    await calcomFetch(`/bookings/${encodeURIComponent(bookingUid)}/cancel`, active.config.apiKey, { method: "POST", body: JSON.stringify({ cancellationReason: "Richiesta telefonica del cliente" }) }, "2024-08-13");
    await recordSuccess(organizationId);
  } catch (error) {
    await recordError(organizationId, error);
    throw error;
  }
}
