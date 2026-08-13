import { and, eq, sql } from "drizzle-orm";
import { getDb, isDatabaseConfigured } from "../../db";
import { auditLogs, integrations } from "../../db/schema";
import { decryptIntegrationConfig, encryptIntegrationConfig, integrationEncryptionReady } from "./integration-crypto";
import { normalizePhone, safeEqual, verifyHmacHex } from "./security";
import { ValidationError } from "./validation";
import { assertOrganizationFeature } from "./billing-entitlements";

const PROVIDER = "whatsapp";

type WhatsAppConfig = {
  accessToken: string;
  phoneNumberId: string;
  appSecret: string;
  verifyToken: string;
  templateName: string;
  templateLanguage: string;
};

type WhatsAppMetadata = {
  phoneNumberId?: string;
  displayPhoneNumber?: string;
  verifiedName?: string;
  qualityRating?: string;
  templateName?: string;
  templateLanguage?: string;
  lastVerifiedAt?: string;
  lastSuccessAt?: string;
  lastError?: string;
  lastErrorCode?: number;
  lastErrorAt?: string;
};

type MetaErrorPayload = { error?: { message?: string; code?: number; error_subcode?: number; error_data?: { details?: string }; fbtrace_id?: string } };

export class WhatsAppError extends Error {
  constructor(message: string, public readonly code?: number, public readonly subcode?: number) { super(message); }
}

function apiVersion() {
  const configured = process.env.WHATSAPP_API_VERSION || "v23.0";
  return /^v\d+\.\d+$/.test(configured) ? configured : "v23.0";
}

function publicMetaError(payload: MetaErrorPayload, status: number) {
  const error = payload.error;
  const known: Record<number, string> = {
    100: "Dati del messaggio non validi",
    190: "Token Meta scaduto o non valido",
    130429: "Limite temporaneo di invio raggiunto",
    131026: "Il numero non può ricevere il messaggio",
    131042: "Problema di pagamento dell’account WhatsApp",
    131047: "Finestra di conversazione scaduta: serve un template approvato",
    132000: "Il template non accetta i parametri inviati",
    132001: "Template WhatsApp non trovato o non approvato nella lingua scelta",
  };
  const fallback = error?.error_data?.details || error?.message || `Meta ha risposto con errore ${status}`;
  const message = error?.code && known[error.code] ? known[error.code] : fallback;
  return new WhatsAppError(String(message).slice(0, 240), error?.code, error?.error_subcode);
}

async function metaFetch<T>(path: string, accessToken: string, init: RequestInit = {}) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(`https://graph.facebook.com/${apiVersion()}${path}`, {
        ...init,
        headers: { Authorization: `Bearer ${accessToken}`, ...(init.body ? { "Content-Type": "application/json" } : {}), ...init.headers },
        signal: AbortSignal.timeout(10_000),
        cache: "no-store",
      });
      const payload = await response.json().catch(() => ({})) as T & MetaErrorPayload;
      if (response.ok) return payload;
      const error = publicMetaError(payload, response.status);
      if (response.status !== 429 && response.status < 500) throw error;
      lastError = error;
    } catch (error) {
      if (error instanceof WhatsAppError && error.code && ![130429].includes(error.code)) throw error;
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 350 * 2 ** attempt));
  }
  throw lastError instanceof WhatsAppError ? lastError : new WhatsAppError("Meta WhatsApp non è raggiungibile in questo momento");
}

async function integrationRow(organizationId: string) {
  if (!isDatabaseConfigured()) return null;
  return (await getDb().query.integrations.findFirst({ where: and(eq(integrations.organizationId, organizationId), eq(integrations.provider, PROVIDER)) })) || null;
}

function environmentConfig(): WhatsAppConfig | null {
  const { WHATSAPP_ACCESS_TOKEN: accessToken, WHATSAPP_PHONE_NUMBER_ID: phoneNumberId, WHATSAPP_APP_SECRET: appSecret, WHATSAPP_VERIFY_TOKEN: verifyToken, WHATSAPP_TEMPLATE_NAME: templateName } = process.env;
  if (!accessToken || !phoneNumberId || !appSecret || !verifyToken || !templateName) return null;
  return { accessToken, phoneNumberId, appSecret, verifyToken, templateName, templateLanguage: process.env.WHATSAPP_TEMPLATE_LANGUAGE || "it" };
}

async function configFromRow(row: typeof integrations.$inferSelect | null) {
  if (!row || row.status !== "connected" || !row.encryptedConfig) return null;
  try { return decryptIntegrationConfig<WhatsAppConfig>(row.encryptedConfig); }
  catch { throw new WhatsAppError("Il collegamento WhatsApp non può essere letto. Ricollegalo dalle impostazioni"); }
}

async function activeConfig(organizationId: string) {
  const row = await integrationRow(organizationId);
  const saved = await configFromRow(row);
  if (saved) return { config: saved, source: "organization" as const };
  const fallback = environmentConfig();
  return fallback && process.env.WHATSAPP_ORGANIZATION_ID === organizationId ? { config: fallback, source: "environment" as const } : null;
}

async function updateMetadata(organizationId: string, values: WhatsAppMetadata) {
  if (!isDatabaseConfigured()) return;
  const row = await integrationRow(organizationId);
  if (!row) return;
  await getDb().update(integrations).set({ metadata: { ...(row.metadata as WhatsAppMetadata), ...values }, updatedAt: new Date() }).where(eq(integrations.id, row.id));
}

async function recordProviderError(organizationId: string, error: unknown) {
  const typed = error instanceof WhatsAppError ? error : new WhatsAppError(error instanceof Error ? error.message : "Errore WhatsApp sconosciuto");
  await updateMetadata(organizationId, { lastError: typed.message.slice(0, 240), lastErrorCode: typed.code, lastErrorAt: new Date().toISOString() });
}

async function recordProviderSuccess(organizationId: string) {
  await updateMetadata(organizationId, { lastSuccessAt: new Date().toISOString(), lastError: undefined, lastErrorCode: undefined, lastErrorAt: undefined });
}

export async function getWhatsAppAdminStatus(organizationId: string) {
  const row = await integrationRow(organizationId);
  const metadata = (row?.metadata || {}) as WhatsAppMetadata;
  const env = environmentConfig();
  const encryptionReady = integrationEncryptionReady();
  const stored = row?.status === "connected" && Boolean(row.encryptedConfig);
  let credentialError: string | null = null;
  if (stored) {
    try { await configFromRow(row); }
    catch (error) { credentialError = error instanceof Error ? error.message : "Credenziali WhatsApp non leggibili"; }
  }
  const connected = stored && encryptionReady && !credentialError;
  const usingEnvironment = !stored && Boolean(env) && process.env.WHATSAPP_ORGANIZATION_ID === organizationId;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return {
    connected: connected || usingEnvironment,
    managedByOrganization: connected,
    encryptionReady,
    phoneNumber: metadata.displayPhoneNumber || (usingEnvironment ? "Numero configurato su Render" : null),
    phoneNumberId: metadata.phoneNumberId || (usingEnvironment ? env?.phoneNumberId || null : null),
    verifiedName: metadata.verifiedName || null,
    templateName: metadata.templateName || (usingEnvironment ? env?.templateName || null : null),
    callbackUrl: `${baseUrl.replace(/\/$/, "")}/api/webhooks/whatsapp?organization=${encodeURIComponent(organizationId)}`,
    lastVerifiedAt: metadata.lastVerifiedAt || null,
    lastSuccessAt: metadata.lastSuccessAt || null,
    lastError: credentialError || metadata.lastError || null,
    lastErrorCode: metadata.lastErrorCode || null,
  };
}

export async function connectWhatsApp(input: { organizationId: string; actorEmail: string; accessToken: string; phoneNumberId: string; appSecret: string; verifyToken: string; templateName: string; templateLanguage: string }) {
  if (!isDatabaseConfigured()) throw new ValidationError("Prima collega il database");
  if (!integrationEncryptionReady()) throw new ValidationError("Manca la chiave di sicurezza delle integrazioni");
  if (input.accessToken.length < 40) throw new ValidationError("Il token Meta non sembra completo");
  if (!/^\d{5,30}$/.test(input.phoneNumberId)) throw new ValidationError("ID numero WhatsApp non valido");
  if (input.appSecret.length < 24) throw new ValidationError("App Secret Meta non valido");
  if (input.verifyToken.length < 16) throw new ValidationError("Il token di verifica deve avere almeno 16 caratteri");
  if (!/^[a-z0-9_]{2,512}$/.test(input.templateName)) throw new ValidationError("Il nome template può contenere solo lettere minuscole, numeri e trattini bassi");
  if (!/^[A-Za-z_-]{2,15}$/.test(input.templateLanguage)) throw new ValidationError("Lingua template non valida");

  const [alreadyAssigned] = await getDb().select({ organizationId: integrations.organizationId }).from(integrations).where(and(eq(integrations.provider, PROVIDER), eq(integrations.status, "connected"), sql`${integrations.metadata}->>'phoneNumberId' = ${input.phoneNumberId}`)).limit(1);
  if (alreadyAssigned && alreadyAssigned.organizationId !== input.organizationId) throw new ValidationError("Questo numero WhatsApp è già collegato a un’altra attività");

  let profile: { display_phone_number?: string; verified_name?: string; quality_rating?: string };
  try {
    profile = await metaFetch(`/${input.phoneNumberId}?fields=display_phone_number,verified_name,quality_rating`, input.accessToken);
  } catch (error) {
    throw new ValidationError(error instanceof Error ? `Collegamento non riuscito: ${error.message}` : "Collegamento Meta non riuscito");
  }

  const config: WhatsAppConfig = { accessToken: input.accessToken, phoneNumberId: input.phoneNumberId, appSecret: input.appSecret, verifyToken: input.verifyToken, templateName: input.templateName, templateLanguage: input.templateLanguage };
  const encryptedConfig = encryptIntegrationConfig(config);
  const metadata: WhatsAppMetadata = { phoneNumberId: input.phoneNumberId, displayPhoneNumber: profile.display_phone_number, verifiedName: profile.verified_name, qualityRating: profile.quality_rating, templateName: input.templateName, templateLanguage: input.templateLanguage, lastVerifiedAt: new Date().toISOString(), lastSuccessAt: new Date().toISOString() };
  await getDb().insert(integrations).values({ organizationId: input.organizationId, provider: PROVIDER, status: "connected", encryptedConfig, metadata })
    .onConflictDoUpdate({ target: [integrations.organizationId, integrations.provider], set: { status: "connected", encryptedConfig, metadata, updatedAt: new Date() } });
  await getDb().insert(auditLogs).values({ organizationId: input.organizationId, actorEmail: input.actorEmail, action: "whatsapp.connected", entityType: "integration", metadata: { phoneNumberId: input.phoneNumberId, displayPhoneNumber: profile.display_phone_number, templateName: input.templateName } });
  return getWhatsAppAdminStatus(input.organizationId);
}

export async function disconnectWhatsApp(organizationId: string, actorEmail: string) {
  if (!isDatabaseConfigured()) return { ok: true };
  await getDb().update(integrations).set({ status: "disconnected", encryptedConfig: null, metadata: {}, updatedAt: new Date() }).where(and(eq(integrations.organizationId, organizationId), eq(integrations.provider, PROVIDER)));
  await getDb().insert(auditLogs).values({ organizationId, actorEmail, action: "whatsapp.disconnected", entityType: "integration" });
  return { ok: true };
}

export async function getWhatsAppWebhookContext(input: { organizationHint?: string | null; phoneNumberId?: string | null }) {
  if (isDatabaseConfigured() && input.organizationHint) {
    const row = await integrationRow(input.organizationHint);
    const config = await configFromRow(row);
    if (config && (!input.phoneNumberId || config.phoneNumberId === input.phoneNumberId)) return { organizationId: input.organizationHint, config };
  }
  if (isDatabaseConfigured() && input.phoneNumberId) {
    const [row] = await getDb().select().from(integrations).where(and(eq(integrations.provider, PROVIDER), eq(integrations.status, "connected"), sql`${integrations.metadata}->>'phoneNumberId' = ${input.phoneNumberId}`)).limit(1);
    const config = await configFromRow(row || null);
    if (row && config) return { organizationId: row.organizationId, config };
  }
  const config = environmentConfig();
  const organizationId = process.env.WHATSAPP_ORGANIZATION_ID || null;
  const organizationMatches = Boolean(organizationId && (!input.organizationHint || organizationId === input.organizationHint));
  return config && organizationMatches && (!input.phoneNumberId || config.phoneNumberId === input.phoneNumberId) ? { organizationId, config } : null;
}

export async function verifyWhatsAppChallenge(organizationId: string | null, suppliedToken: string | null) {
  if (!suppliedToken) return false;
  const context = await getWhatsAppWebhookContext({ organizationHint: organizationId });
  return Boolean(context && safeEqual(context.config.verifyToken, suppliedToken));
}

export async function verifyWhatsAppWebhook(rawBody: string, signature: string | null, input: { organizationHint?: string | null; phoneNumberId?: string | null }) {
  const context = await getWhatsAppWebhookContext(input);
  if (!context || !signature) return null;
  const received = signature.startsWith("sha256=") ? signature.slice(7) : signature;
  return await verifyHmacHex(rawBody, received, context.config.appSecret) ? context : null;
}

export async function sendWhatsAppText(input: { organizationId: string; to: string; body: string }) {
  await assertOrganizationFeature(input.organizationId, "whatsapp");
  const active = await activeConfig(input.organizationId);
  if (!active) {
    if (process.env.NODE_ENV === "production") throw new ValidationError("WhatsApp non è collegato: il messaggio non è stato inviato. Apri Stato del motore per completare Meta.");
    return { id: `demo-wa-${Date.now()}`, demo: true, provider: "demo" as const };
  }
  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: normalizePhone(input.to).replace(/\D/g, ""),
    type: "template",
    template: {
      name: active.config.templateName,
      language: { code: active.config.templateLanguage },
      components: [{ type: "body", parameters: [{ type: "text", text: input.body }] }],
    },
  };
  try {
    const data = await metaFetch<{ messages?: Array<{ id: string; message_status?: string }> }>(`/${active.config.phoneNumberId}/messages`, active.config.accessToken, { method: "POST", body: JSON.stringify(payload) });
    const id = data.messages?.[0]?.id;
    if (!id) throw new WhatsAppError("Meta non ha restituito il codice del messaggio");
    await recordProviderSuccess(input.organizationId);
    return { id, demo: false, provider: active.source };
  } catch (error) {
    await recordProviderError(input.organizationId, error);
    throw error;
  }
}
