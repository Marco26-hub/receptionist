import { verifyRetellSignature } from "../../../../../lib/retell";
import { findUpcomingVoiceAppointments, findVoiceAgentByRetellId } from "../../../../../lib/voice-repository";

type ToolPayload = { call?: { agent_id?: string }; args?: Record<string, unknown> };

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!verifyRetellSignature(rawBody, request.headers.get("x-retell-signature"))) return Response.json({ error: "Richiesta non autorizzata" }, { status: 401 });
  try {
    const payload = JSON.parse(rawBody) as ToolPayload;
    const agent = payload.call?.agent_id ? await findVoiceAgentByRetellId(payload.call.agent_id) : null;
    if (!agent) return Response.json({ error: "Assistente non riconosciuto" }, { status: 404 });
    const firstName = String(payload.args?.first_name || "").trim().slice(0, 100);
    const phone = String(payload.args?.phone || "").trim().slice(0, 40);
    if (!firstName || !phone) return Response.json({ found: false, message: "Chiedi nome e numero di telefono usato per la prenotazione." });
    const items = await findUpcomingVoiceAppointments({ organizationId: agent.organizationId, firstName, phone, testMode: agent.testMode });
    return Response.json({ found: items.length > 0, appointments: items, instruction: items.length ? "Se ce n’è più di uno, chiedi quale appuntamento vuole gestire." : "Nessun appuntamento futuro trovato. Verifica i dati o passa la richiesta allo staff." });
  } catch {
    return Response.json({ found: false, message: "Non riesco a verificare gli appuntamenti. Passa la richiesta allo staff." }, { status: 400 });
  }
}
