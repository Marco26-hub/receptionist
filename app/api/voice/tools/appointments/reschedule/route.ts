import { verifyRetellSignature } from "../../../../../lib/retell";
import { findVoiceAgentByRetellId, rescheduleVoiceAppointment } from "../../../../../lib/voice-repository";

type ToolPayload = { call?: { agent_id?: string }; args?: Record<string, unknown> };

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!verifyRetellSignature(rawBody, request.headers.get("x-retell-signature"))) return Response.json({ error: "Richiesta non autorizzata" }, { status: 401 });
  try {
    const payload = JSON.parse(rawBody) as ToolPayload;
    const agent = payload.call?.agent_id ? await findVoiceAgentByRetellId(payload.call.agent_id) : null;
    if (!agent) return Response.json({ error: "Assistente non riconosciuto" }, { status: 404 });
    if (payload.args?.confirmed !== true) return Response.json({ changed: false, message: "Ripeti appuntamento e nuovo orario, poi chiedi una conferma esplicita." });
    const startsAt = new Date(String(payload.args?.starts_at || ""));
    const result = await rescheduleVoiceAppointment({
      organizationId: agent.organizationId,
      appointmentId: String(payload.args?.appointment_id || ""),
      phone: String(payload.args?.phone || ""),
      startsAt,
      confirmed: true,
      testMode: agent.testMode,
    });
    return Response.json({ changed: true, test_mode: result.demo, appointment_id: result.appointmentId, message: result.demo ? "Prova riuscita: nessun appuntamento reale è stato modificato." : "Appuntamento spostato. Ripeti il nuovo giorno e orario." });
  } catch (error) {
    return Response.json({ changed: false, message: error instanceof Error ? error.message : "Non riesco a spostare l’appuntamento. Passa la richiesta allo staff." }, { status: 400 });
  }
}
