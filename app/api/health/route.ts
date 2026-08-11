import { sql } from "drizzle-orm";
import { getDb, isDatabaseConfigured } from "../../../db";

export async function GET(request: Request) {
  const production = process.env.NODE_ENV === "production";
  const checks = {
    database: isDatabaseConfigured(),
    session: Boolean(process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32),
    ai: Boolean(process.env.OPENAI_API_KEY && process.env.AI_DRAFTS_ENABLED === "true"),
    voice: Boolean(process.env.RETELL_API_KEY),
    voiceAi: Boolean(process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY),
    whatsapp: Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_APP_SECRET && process.env.WHATSAPP_TEMPLATE_NAME),
    payments: Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID && process.env.STRIPE_WEBHOOK_SECRET),
    cron: Boolean(process.env.CRON_SECRET && process.env.CRON_SECRET.length >= 24),
    authProvider: Boolean((process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) || (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD)),
    legal: Boolean(process.env.LEGAL_COMPANY_NAME && process.env.LEGAL_VAT_NUMBER && process.env.LEGAL_ADDRESS && process.env.LEGAL_EMAIL),
    publicUrl: Boolean(process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://")),
  };
  let databaseReachable = !checks.database;
  if (checks.database && new URL(request.url).searchParams.get("deep") === "1") {
    try { await getDb().execute(sql`select 1`); databaseReachable = true; } catch { databaseReachable = false; }
  } else if (checks.database) databaseReachable = true;
  const coreReady = checks.database && checks.session && checks.authProvider && checks.whatsapp && checks.cron && checks.legal && checks.publicUrl && databaseReachable;
  return Response.json({ status: production ? coreReady ? "ready" : "degraded" : "development", version: "2.0.0", checks: { ...checks, databaseReachable } }, { status: production && !coreReady ? 503 : 200, headers: { "Cache-Control": "no-store" } });
}
