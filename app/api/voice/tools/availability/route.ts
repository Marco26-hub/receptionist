import { verifyRetellSignature } from "../../../../lib/retell";
import { findVoiceAgentByRetellId, getAvailableVoiceSlots } from "../../../../lib/voice-repository";
import { assertOrganizationFeature } from "../../../../lib/billing-entitlements";

type ToolPayload = { call?: { agent_id?: string }; args?: Record<string, unknown> };

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!verifyRetellSignature(rawBody, request.headers.get("x-retell-signature"))) return Response.json({ error: "Richiesta non autorizzata" }, { status: 401 });
  try {
    const payload = JSON.parse(rawBody) as ToolPayload;
    const agent = payload.call?.agent_id ? await findVoiceAgentByRetellId(payload.call.agent_id) : null;
    if (!agent) return Response.json({ error: "Assistente non riconosciuto" }, { status: 404 });
    if (!agent.testMode) await assertOrganizationFeature(agent.organizationId, "voice");
    if (!agent.bookingEnabled) return Response.json({ available: false, message: "Le prenotazioni telefoniche non sono attive. Passa la richiesta allo staff." });
    const requested = String(payload.args?.service_name || "").trim().toLocaleLowerCase("it");
    const service = agent.services.find((item) => item.enabled && item.name.toLocaleLowerCase("it") === requested);
    if (!service) return Response.json({ available: false, message: "Servizio non riconosciuto. Chiedi quale servizio approvato desidera la persona." });
    const slots = await getAvailableVoiceSlots(agent.organizationId, service.durationMinutes);
    return Response.json({ available: slots.length > 0, service: service.name, duration_minutes: service.durationMinutes, slots, instruction: slots.length ? "Proponi al massimo due orari e attendi la scelta." : "Nessun posto trovato nei prossimi 14 giorni. Passa la richiesta allo staff." });
  } catch {
    return Response.json({ error: "Non riesco a controllare l'agenda in questo momento. Passa la richiesta allo staff." }, { status: 400 });
  }
}
