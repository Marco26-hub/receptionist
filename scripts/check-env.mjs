const required = [
  ["NEXT_PUBLIC_SITE_URL", (value) => /^https:\/\//.test(value)],
  ["DATABASE_URL", Boolean],
  ["SESSION_SECRET", (value) => value.length >= 32],
  ["CRON_SECRET", (value) => value.length >= 24],
  ["WHATSAPP_ACCESS_TOKEN", Boolean],
  ["WHATSAPP_PHONE_NUMBER_ID", Boolean],
  ["WHATSAPP_VERIFY_TOKEN", Boolean],
  ["WHATSAPP_APP_SECRET", Boolean],
  ["WHATSAPP_TEMPLATE_NAME", Boolean],
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
