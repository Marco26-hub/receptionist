import { verifyRetellSignature } from "../../../../../lib/retell";
import { cancelVoiceAppointment, findVoiceAgentByRetellId } from "../../../../../lib/voice-repository";
import { assertOrganizationFeature } from "../../../../../lib/billing-entitlements";

type ToolPayload = { call?: { agent_id?: string }; args?: Record<string, unknown> };

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!verifyRetellSignature(rawBody, request.headers.get("x-retell-signature"))) return Response.json({ error: "Richiesta non autorizzata" }, { status: 401 });
  try {
    const payload = JSON.parse(rawBody) as ToolPayload;
    const agent = payload.call?.agent_id ? await findVoiceAgentByRetellId(payload.call.agent_id) : null;
    if (!agent) return Response.json({ error: "Assistente non riconosciuto" }, { status: 404 });
    if (!agent.testMode) await assertOrganizationFeature(agent.organizationId, "voice");
    if (payload.args?.confirmed !== true) return Response.json({ cancelled: false, message: "Ripeti l’appuntamento da annullare e chiedi una conferma esplicita." });
    const result = await cancelVoiceAppointment({
      organizationId: agent.organizationId,
      appointmentId: String(payload.args?.appointment_id || ""),
      phone: String(payload.args?.phone || ""),
      confirmed: true,
      testMode: agent.testMode,
    });
    return Response.json({ cancelled: true, test_mode: result.demo, appointment_id: result.appointmentId, message: result.demo ? "Prova riuscita: nessun appuntamento reale è stato annullato." : "Appuntamento annullato. Conferma l’esito alla persona." });
  } catch (error) {
    return Response.json({ cancelled: false, message: error instanceof Error ? error.message : "Non riesco ad annullare l’appuntamento. Passa la richiesta allo staff." }, { status: 400 });
  }
}
