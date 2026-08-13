const required = [
  ["NEXT_PUBLIC_SITE_URL", (value) => /^https:\/\//.test(value)],
  ["DATABASE_URL", Boolean],
  ["SESSION_SECRET", (value) => value.length >= 32],
  ["CRON_SECRET", (value) => value.length >= 24],
  ["INTEGRATION_ENCRYPTION_KEY", (value) => value.length >= 32],
  ["LEGAL_COMPANY_NAME", Boolean],
  ["LEGAL_VAT_NUMBER", Boolean],
  ["LEGAL_ADDRESS", Boolean],
  ["LEGAL_EMAIL", (value) => value.includes("@")],
];

const authReady = Boolean((process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) || (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD));
const failed = required.filter(([name, validate]) => !validate(String(process.env[name] || ""))).map(([name]) => name);
if (!authReady) failed.push("SUPABASE_URL + SUPABASE_ANON_KEY oppure ADMIN_EMAIL + ADMIN_PASSWORD");

if (failed.length) {
  console.error("Configurazione non pronta per la produzione:\n" + failed.map((name) => `- ${name}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log("Configurazione essenziale pronta. Verifica ora GET /api/health?deep=1 sul deploy.");
}

const voiceMissing = ["RETELL_API_KEY", "OPENROUTER_API_KEY oppure OPENAI_API_KEY"].filter((name) => name === "RETELL_API_KEY"
  ? !process.env.RETELL_API_KEY
  : !(process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY));
if (voiceMissing.length) console.warn("Assistente vocale non ancora completo:\n" + voiceMissing.map((name) => `- ${name}`).join("\n"));

const whatsappEnvironmentKeys = ["WHATSAPP_ACCESS_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_VERIFY_TOKEN", "WHATSAPP_APP_SECRET", "WHATSAPP_TEMPLATE_NAME"];
const whatsappEnvironmentStarted = whatsappEnvironmentKeys.some((name) => process.env[name]);
const whatsappEnvironmentMissing = [...whatsappEnvironmentKeys.filter((name) => !process.env[name]), ...(!process.env.WHATSAPP_ORGANIZATION_ID ? ["WHATSAPP_ORGANIZATION_ID"] : [])];
if (whatsappEnvironmentStarted && whatsappEnvironmentMissing.length) console.warn("Configurazione WhatsApp generale incompleta:\n" + whatsappEnvironmentMissing.map((name) => `- ${name}`).join("\n"));
if (!whatsappEnvironmentStarted) console.warn("WhatsApp va collegato separatamente per ogni azienda dalla pagina Impostazioni.");

const stripePriceKeys = ["STRIPE_PRICE_AGENDA_CLIENTI", "STRIPE_PRICE_TUTTO_IN_UNO", "STRIPE_PRICE_VOCE_BASE", "STRIPE_PRICE_VOCE_ATTIVITA", "STRIPE_PRICE_VOCE_AZIENDA"];
const stripeMissing = [
  ...(!process.env.STRIPE_SECRET_KEY ? ["STRIPE_SECRET_KEY"] : []),
  ...(!process.env.STRIPE_WEBHOOK_SECRET ? ["STRIPE_WEBHOOK_SECRET"] : []),
  ...(!stripePriceKeys.some((name) => process.env[name]) && !process.env.STRIPE_PRICE_ID ? ["almeno un codice prezzo Stripe"] : []),
];
if (stripeMissing.length) console.warn("Pagamenti Stripe non ancora completi:\n" + stripeMissing.map((name) => `- ${name}`).join("\n"));
