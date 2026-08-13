import { isDatabaseConfigured } from "../../db";
import { stripeIsConfigured } from "./stripe";

export type RuntimeServiceStatus = {
  id: "database" | "ai" | "voice" | "calendar" | "whatsapp" | "stripe";
  label: string;
  state: "active" | "fallback" | "blocked";
  detail: string;
  href: string;
};

export function getRuntimeServiceStatus(input: {
  calendar?: { connected?: boolean; lastError?: string | null };
  whatsapp?: { connected?: boolean; lastError?: string | null };
  billing?: {
    enforcementEnabled: boolean;
    voice: { allowed: boolean; reason: string | null };
    whatsapp: { allowed: boolean; reason: string | null };
  };
} = {}): RuntimeServiceStatus[] {
  const calendar = input.calendar || {};
  const whatsappStatus = input.whatsapp || {};
  const database = isDatabaseConfigured();
  const ai = Boolean((process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY) && process.env.AI_DRAFTS_ENABLED === "true");
  const voice = Boolean(process.env.RETELL_API_KEY);
  const whatsapp = Boolean(whatsappStatus.connected);
  const stripe = stripeIsConfigured();
  const voiceBillingBlocked = Boolean(input.billing?.enforcementEnabled && !input.billing.voice.allowed);
  const whatsappBillingBlocked = Boolean(input.billing?.enforcementEnabled && !input.billing.whatsapp.allowed);
  return [
    { id: "database", label: "Dati", state: database ? "active" : "fallback", detail: database ? "Database collegato" : "Modalità dimostrativa: nessun dato viene salvato", href: "/admin/impostazioni" },
    { id: "ai", label: "Testi AI", state: ai ? "active" : "fallback", detail: ai ? "Modello AI collegato" : "Usa testi standard locali, non generati dall’AI", href: "/admin/impostazioni" },
    { id: "voice", label: "Telefono", state: voice && !voiceBillingBlocked ? "active" : "blocked", detail: voiceBillingBlocked ? input.billing!.voice.reason || "Servizio sospeso dal piano" : voice ? "Retell collegato" : "Solo simulatore: non risponde a chiamate reali", href: voiceBillingBlocked ? "/admin/abbonamento" : "/admin/voce" },
    { id: "calendar", label: "Calendario", state: calendar.connected && !calendar.lastError ? "active" : "blocked", detail: calendar.lastError ? `Errore visibile: ${calendar.lastError}` : calendar.connected ? "Cal.com collegato" : "Usa solo l’agenda interna: Cal.com non collegato", href: "/admin/impostazioni" },
    { id: "whatsapp", label: "WhatsApp", state: whatsapp && !whatsappStatus.lastError && !whatsappBillingBlocked ? "active" : "blocked", detail: whatsappBillingBlocked ? input.billing!.whatsapp.reason || "Servizio sospeso dal piano" : whatsappStatus.lastError ? `Errore visibile: ${whatsappStatus.lastError}` : whatsapp ? "Meta collegato per questa azienda" : "Invio reale bloccato: Meta non collegato", href: whatsappBillingBlocked ? "/admin/abbonamento" : "/admin/impostazioni" },
    { id: "stripe", label: "Pagamenti", state: stripe ? input.billing?.enforcementEnabled ? "active" : "fallback" : "blocked", detail: stripe ? input.billing?.enforcementEnabled ? "Stripe collegato e controlli automatici attivi" : "Stripe collegato; sospensioni automatiche ancora in collaudo" : "Checkout reale non disponibile", href: "/admin/abbonamento" },
  ];
}
