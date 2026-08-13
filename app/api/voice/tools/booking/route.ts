import { verifyRetellSignature } from "../../../../lib/retell";
import { createVoiceBooking, findVoiceAgentByRetellId, getAvailableVoiceSlots } from "../../../../lib/voice-repository";
import { assertOrganizationFeature } from "../../../../lib/billing-entitlements";

type ToolPayload = { call?: { agent_id?: string; call_id?: string }; args?: Record<string, unknown> };

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!verifyRetellSignature(rawBody, request.headers.get("x-retell-signature"))) return Response.json({ error: "Richiesta non autorizzata" }, { status: 401 });
  try {
    const payload = JSON.parse(rawBody) as ToolPayload;
    const agent = payload.call?.agent_id ? await findVoiceAgentByRetellId(payload.call.agent_id) : null;
    if (!agent) return Response.json({ error: "Assistente non riconosciuto" }, { status: 404 });
    if (!agent.testMode) await assertOrganizationFeature(agent.organizationId, "voice");
    if (!agent.bookingEnabled) return Response.json({ booked: false, message: "Le prenotazioni telefoniche non sono attive. Passa la richiesta allo staff." });
    const args = payload.args || {};
    const requested = String(args.service_name || "").trim().toLocaleLowerCase("it");
    const service = agent.services.find((item) => item.enabled && item.name.toLocaleLowerCase("it") === requested);
    if (!service) return Response.json({ booked: false, message: "Servizio non riconosciuto. Non creare l'appuntamento." });
    const startsAt = new Date(String(args.starts_at || ""));
    if (!Number.isFinite(startsAt.getTime()) || startsAt <= new Date()) return Response.json({ booked: false, message: "Data o ora non valida. Controlla di nuovo la disponibilità." });
    if (args.confirmed !== true) return Response.json({ booked: false, message: "Chiedi prima una conferma esplicita di nome, servizio, giorno e ora." });
    const available = await getAvailableVoiceSlots(agent.organizationId, service.durationMinutes);
    if (!available.some((slot) => Math.abs(new Date(slot.startsAt).getTime() - startsAt.getTime()) < 60_000)) {
      return Response.json({ booked: false, message: "L'orario non è più tra quelli disponibili. Controlla di nuovo l'agenda." });
    }
    const firstName = String(args.first_name || "").trim().slice(0, 100);
    const phone = String(args.phone || "").trim().slice(0, 40);
    if (!firstName || !phone) return Response.json({ booked: false, message: "Servono nome e numero di telefono prima di prenotare." });
    const result = await createVoiceBooking({
      organizationId: agent.organizationId,
      firstName,
      phone,
      serviceName: service.name,
      startsAt,
      durationMinutes: service.durationMinutes,
      priceCents: service.priceCents,
      confirmed: true,
      testMode: agent.testMode,
      externalId: payload.call?.call_id ? `voice:${payload.call.call_id}:${startsAt.toISOString()}` : undefined,
    });
    return Response.json({ booked: true, test_mode: result.demo, appointment_id: result.appointmentId, message: result.demo ? "Prova riuscita: nessun appuntamento reale è stato creato." : "Appuntamento confermato. Ripeti servizio, giorno e ora alla persona." });
  } catch {
    return Response.json({ booked: false, message: "Non riesco a completare la prenotazione. Passa la richiesta allo staff." }, { status: 400 });
  }
}
