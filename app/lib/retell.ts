import { createHmac, timingSafeEqual } from "node:crypto";
import type { VoiceFaq, VoiceService } from "../../db/schema";
import { siteUrl } from "./site";
import { ValidationError } from "./validation";
import { safeVoiceGreeting, voiceLanguageRule } from "./voice-language";

const RETELL_BASE_URL = "https://api.retellai.com";

async function retellRequest<T>(path: string, init: RequestInit = {}) {
  if (!process.env.RETELL_API_KEY) throw new ValidationError("Retell non è ancora collegato");
  const response = await fetch(`${RETELL_BASE_URL}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${process.env.RETELL_API_KEY}`, "Content-Type": "application/json", ...init.headers },
  });
  if (!response.ok) {
    await response.text();
    throw new ValidationError(`Retell non ha accettato la configurazione. Controlla il codice assistente e la voce (${response.status})`);
  }
  return response.status === 204 ? undefined as T : await response.json() as T;
}

export function verifyRetellSignature(rawBody: string, signature: string | null) {
  if (!process.env.RETELL_API_KEY || !signature) return false;
  const match = /^v=(\d+),d=([a-f0-9]+)$/i.exec(signature.trim());
  if (!match) return false;
  const timestamp = Number(match[1]);
  if (!Number.isFinite(timestamp) || Math.abs(Date.now() - timestamp) > 5 * 60_000) return false;
  const expected = createHmac("sha256", process.env.RETELL_API_KEY).update(rawBody + match[1]).digest();
  const supplied = Buffer.from(match[2], "hex");
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

function knowledgeText(services: VoiceService[], faqs: VoiceFaq[]) {
  const serviceText = services.filter((service) => service.enabled).map((service) => `- ${service.name}: durata ${service.durationMinutes} minuti, prezzo €${(service.priceCents / 100).toFixed(2)}`).join("\n");
  const faqText = faqs.map((faq) => `Domanda: ${faq.question}\nRisposta approvata: ${faq.answer}`).join("\n\n");
  return `\n\nSERVIZI APPROVATI\n${serviceText}\n\nRISPOSTE APPROVATE\n${faqText}`;
}

export async function syncAndPublishRetellAgent(input: { agentId: string; name: string; voiceId: string; language: string; greeting: string; systemPrompt: string; services: VoiceService[]; faqs: VoiceFaq[]; transferNumber: string | null; bookingEnabled: boolean; recordingEnabled: boolean }) {
  const agent = await retellRequest<{ response_engine?: { type?: string; llm_id?: string } }>(`/get-agent/${encodeURIComponent(input.agentId)}`);
  if (agent.response_engine?.type !== "retell-llm" || !agent.response_engine.llm_id) throw new ValidationError("In Retell seleziona un motore Retell LLM per questo assistente");
  const tools: Array<Record<string, unknown>> = [
    { type: "end_call", name: "termina_chiamata", description: "Termina la chiamata dopo il saluto finale." },
  ];
  if (input.bookingEnabled) tools.unshift(
    {
      type: "custom",
      name: "controlla_disponibilita",
      description: "Controlla gli orari realmente liberi per un servizio. Usala prima di proporre un appuntamento.",
      url: `${siteUrl}/api/voice/tools/availability`,
      method: "POST",
      speak_during_execution: true,
      speak_after_execution: true,
      parameters: {
        type: "object",
        required: ["service_name"],
        properties: { service_name: { type: "string", description: "Nome esatto del servizio richiesto" } },
      },
    },
    {
      type: "custom",
      name: "prenota_appuntamento",
      description: "Crea l'appuntamento soltanto dopo che la persona ha confermato nome, telefono, servizio, giorno e ora.",
      url: `${siteUrl}/api/voice/tools/booking`,
      method: "POST",
      speak_during_execution: true,
      speak_after_execution: true,
      parameters: {
        type: "object",
        required: ["first_name", "phone", "service_name", "starts_at", "confirmed"],
        properties: {
          first_name: { type: "string", description: "Nome della persona" },
          phone: { type: "string", description: "Numero di telefono completo" },
          service_name: { type: "string", description: "Nome esatto del servizio" },
          starts_at: { type: "string", description: "Data e ora ISO ricevuta dal controllo disponibilità" },
          confirmed: { type: "boolean", description: "Vero solo dopo una conferma esplicita della persona" },
        },
      },
    },
    {
      type: "custom",
      name: "trova_appuntamenti",
      description: "Trova gli appuntamenti futuri dopo aver verificato nome e telefono. Usala prima di spostare o annullare.",
      url: `${siteUrl}/api/voice/tools/appointments/find`,
      method: "POST",
      speak_during_execution: true,
      speak_after_execution: true,
      parameters: {
        type: "object",
        required: ["first_name", "phone"],
        properties: {
          first_name: { type: "string", description: "Nome usato per la prenotazione" },
          phone: { type: "string", description: "Numero di telefono usato per la prenotazione" },
        },
      },
    },
    {
      type: "custom",
      name: "sposta_appuntamento",
      description: "Sposta un appuntamento trovato. Usala soltanto dopo il controllo disponibilità e la conferma esplicita del nuovo orario.",
      url: `${siteUrl}/api/voice/tools/appointments/reschedule`,
      method: "POST",
      speak_during_execution: true,
      speak_after_execution: true,
      parameters: {
        type: "object",
        required: ["appointment_id", "phone", "starts_at", "confirmed"],
        properties: {
          appointment_id: { type: "string", description: "Identificativo ricevuto da trova_appuntamenti" },
          phone: { type: "string", description: "Numero verificato della persona" },
          starts_at: { type: "string", description: "Nuova data e ora ISO ricevuta dal controllo disponibilità" },
          confirmed: { type: "boolean", description: "Vero solo dopo la conferma esplicita del nuovo orario" },
        },
      },
    },
    {
      type: "custom",
      name: "annulla_appuntamento",
      description: "Annulla un appuntamento trovato soltanto dopo averlo ripetuto e aver ricevuto una conferma esplicita.",
      url: `${siteUrl}/api/voice/tools/appointments/cancel`,
      method: "POST",
      speak_during_execution: true,
      speak_after_execution: true,
      parameters: {
        type: "object",
        required: ["appointment_id", "phone", "confirmed"],
        properties: {
          appointment_id: { type: "string", description: "Identificativo ricevuto da trova_appuntamenti" },
          phone: { type: "string", description: "Numero verificato della persona" },
          confirmed: { type: "boolean", description: "Vero solo dopo la conferma esplicita dell’annullamento" },
        },
      },
    },
  );
  if (input.transferNumber) tools.push({
    type: "transfer_call",
    name: "passa_a_una_persona",
    description: "Passa la chiamata allo staff per urgenze, richieste delicate, reclami o quando la persona lo chiede.",
    transfer_destination: { type: "predefined", number: input.transferNumber, ignore_e164_validation: false },
    transfer_option: { type: "cold_transfer", show_transferee_as_caller: false },
  });
  const languageRule = voiceLanguageRule(input.language);
  const greeting = safeVoiceGreeting(input.language, input.name, input.greeting);
  const recordingRule = input.recordingEnabled
    ? "- All'inizio della chiamata, subito dopo esserti presentata, informa chiaramente che la chiamata viene registrata. Se la persona non acconsente, non proseguire con la registrazione e coinvolgi lo staff."
    : "- Non affermare che la chiamata viene registrata: la registrazione audio è disattivata.";
  await retellRequest(`/update-retell-llm/${encodeURIComponent(agent.response_engine.llm_id)}`, {
    method: "PATCH",
    body: JSON.stringify({
      model: "gpt-5-mini",
      model_temperature: 0.1,
      model_high_priority: false,
      tool_call_strict_mode: true,
      start_speaker: "agent",
      begin_message: greeting,
      general_prompt: `${input.systemPrompt}\n\n${languageRule}\nREGOLE OPERATIVE\n${recordingRule}\n- Per un nuovo appuntamento usa prima controlla_disponibilita e poi prenota_appuntamento, soltanto dopo la conferma esplicita.\n- Per spostare o annullare usa prima trova_appuntamenti e verifica nome e telefono.\n- Per spostare controlla anche la nuova disponibilità e chiedi conferma prima di usare sposta_appuntamento.\n- Non dire mai che una prenotazione è creata, spostata o annullata finché lo strumento non restituisce esito positivo.\n- Se mancano dati, il servizio non è riconosciuto o uno strumento fallisce, coinvolgi lo staff.` + knowledgeText(input.services, input.faqs),
      general_tools: tools,
    }),
  });
  await retellRequest(`/update-agent/${encodeURIComponent(input.agentId)}`, {
    method: "PATCH",
    body: JSON.stringify({
      agent_name: input.name,
      voice_id: input.voiceId,
      language: input.language.includes(",") ? input.language.split(",") : input.language,
      webhook_url: `${siteUrl}/api/webhooks/retell`,
      webhook_events: ["call_started", "call_ended", "call_analyzed"],
      data_storage_setting: input.recordingEnabled ? "everything" : "everything_except_pii",
    }),
  });
  await retellRequest(`/publish-agent/${encodeURIComponent(input.agentId)}`, { method: "POST", body: "{}" });
  return { ok: true };
}

export async function createRetellWebCall(agentId: string) {
  return retellRequest<{ call_id: string; access_token: string; agent_id: string }>("/v2/create-web-call", {
    method: "POST",
    body: JSON.stringify({ agent_id: agentId, metadata: { source: "agendapiena-admin-test" }, retell_llm_dynamic_variables: { test_mode: "true" } }),
  });
}

export async function setRetellPhoneActive(phoneNumber: string, agentId: string, active: boolean) {
  return retellRequest<{ phone_number: string }>(`/update-phone-number/${encodeURIComponent(phoneNumber)}`, {
    method: "PATCH",
    body: JSON.stringify({
      inbound_agents: active
        ? [{ agent_id: agentId, agent_version: "latest_published", weight: 1 }]
        : [],
    }),
  });
}
