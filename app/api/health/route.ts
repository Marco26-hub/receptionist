import { and, eq, isNotNull, sql } from "drizzle-orm";
import { getDb, isDatabaseConfigured } from "../../../db";
import { integrations } from "../../../db/schema";
import { stripeIsConfigured } from "../../lib/stripe";

export async function GET(request: Request) {
  const production = process.env.NODE_ENV === "production";
  const checks = {
    database: isDatabaseConfigured(),
    session: Boolean(process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32),
    integrationEncryption: Boolean(process.env.INTEGRATION_ENCRYPTION_KEY && process.env.INTEGRATION_ENCRYPTION_KEY.length >= 32),
    ai: Boolean((process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY) && process.env.AI_DRAFTS_ENABLED === "true"),
    voice: Boolean(process.env.RETELL_API_KEY),
    voiceAi: Boolean(process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY),
    whatsapp: Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ORGANIZATION_ID && process.env.WHATSAPP_APP_SECRET && process.env.WHATSAPP_TEMPLATE_NAME),
    whatsappTenants: 0,
    payments: stripeIsConfigured(),
    cron: Boolean(process.env.CRON_SECRET && process.env.CRON_SECRET.length >= 24),
    authProvider: Boolean((process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) || (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD)),
    legal: Boolean(process.env.LEGAL_COMPANY_NAME && process.env.LEGAL_VAT_NUMBER && process.env.LEGAL_ADDRESS && process.env.LEGAL_EMAIL),
    publicUrl: Boolean(process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://")),
    monitoring: Boolean(process.env.SENTRY_DSN || process.env.HEALTHCHECK_MONITOR_URL),
    backupPolicy: Boolean(process.env.BACKUP_POLICY_CONFIRMED === "true"),
  };
  let databaseReachable = !checks.database;
  if (checks.database) {
    try {
      const [row] = await getDb().select({ count: sql<number>`count(*)` }).from(integrations).where(and(eq(integrations.provider, "whatsapp"), eq(integrations.status, "connected"), isNotNull(integrations.encryptedConfig)));
      checks.whatsappTenants = Number(row?.count || 0);
      checks.whatsapp = checks.whatsapp || checks.whatsappTenants > 0;
    } catch { checks.whatsappTenants = 0; }
  }
  if (checks.database && new URL(request.url).searchParams.get("deep") === "1") {
    try { await getDb().execute(sql`select 1`); databaseReachable = true; } catch { databaseReachable = false; }
  } else if (checks.database) databaseReachable = true;
  const commonReady = checks.database && checks.session && checks.integrationEncryption && checks.authProvider && checks.legal && checks.publicUrl && checks.monitoring && checks.backupPolicy && databaseReachable;
  const readiness = {
    platform: commonReady,
    agenda: commonReady && checks.cron,
    whatsapp: commonReady && checks.cron && checks.whatsapp,
    voice: commonReady && checks.voice && checks.voiceAi,
    payments: commonReady && checks.payments,
  };
  return Response.json({ status: production ? readiness.platform ? "ready" : "degraded" : "development", version: "2.1.0", readiness, checks: { ...checks, databaseReachable } }, { status: production && !readiness.platform ? 503 : 200, headers: { "Cache-Control": "no-store" } });
}
