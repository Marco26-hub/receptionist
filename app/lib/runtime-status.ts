import { isDatabaseConfigured } from "../../db";
import { stripeIsConfigured } from "./stripe";

export type RuntimeServiceStatus = {
  id: "database" | "ai" | "voice" | "calendar" | "whatsapp" | "stripe";
  label: string;
  state: "active" | "fallback" | "blocked";
  detail: string;
  href: string;
};

export function getRuntimeServiceStatus(calendar: { connected?: boolean; lastError?: string | null } = {}): RuntimeServiceStatus[] {
  const database = isDatabaseConfigured();
  const ai = Boolean((process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY) && process.env.AI_DRAFTS_ENABLED === "true");
  const voice = Boolean(process.env.RETELL_API_KEY);
  const whatsapp = Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_TEMPLATE_NAME);
  const stripe = stripeIsConfigured();
  return [
    { id: "database", label: "Dati", state: database ? "active" : "fallback", detail: database ? "Database collegato" : "Modalità dimostrativa: nessun dato viene salvato", href: "/admin/impostazioni" },
    { id: "ai", label: "Testi AI", state: ai ? "active" : "fallback", detail: ai ? "Modello AI collegato" : "Usa testi standard locali, non generati dall’AI", href: "/admin/impostazioni" },
    { id: "voice", label: "Telefono", state: voice ? "active" : "blocked", detail: voice ? "Retell collegato" : "Solo simulatore: non risponde a chiamate reali", href: "/admin/voce" },
    { id: "calendar", label: "Calendario", state: calendar.connected && !calendar.lastError ? "active" : "blocked", detail: calendar.lastError ? `Errore visibile: ${calendar.lastError}` : calendar.connected ? "Cal.com collegato" : "Usa solo l’agenda interna: Cal.com non collegato", href: "/admin/impostazioni" },
    { id: "whatsapp", label: "WhatsApp", state: whatsapp ? "active" : "blocked", detail: whatsapp ? "Meta collegato" : "Invio reale bloccato: Meta non collegato", href: "/admin/impostazioni" },
    { id: "stripe", label: "Pagamenti", state: stripe ? "active" : "blocked", detail: stripe ? "Stripe collegato" : "Checkout reale non disponibile", href: "/admin/abbonamento" },
  ];
}
