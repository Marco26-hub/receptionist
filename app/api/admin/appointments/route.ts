import { requireApiAdmin } from "../../../lib/api-auth";
import { createAppointment } from "../../../lib/repository";
import { jsonError, optionalText, readJson, requiredText } from "../../../lib/validation";

export async function POST(request: Request) {
  const auth = await requireApiAdmin(request); if (auth.response) return auth.response;
  try {
    const body = await readJson(request);
    const startsAt = validDate(body.startsAt, "Inizio");
    const endsAt = body.endsAt ? validDate(body.endsAt, "Fine") : new Date(startsAt.getTime() + 60 * 60 * 1000);
    if (endsAt <= startsAt) return Response.json({ ok: false, error: "La fine deve essere successiva all'inizio" }, { status: 400 });
    const result = await createAppointment(auth.session.organizationId, {
      customerId: optionalText(body.customerId, 80),
      serviceName: requiredText(body.serviceName, "Servizio", 150),
      startsAt,
      endsAt,
      valueCents: Math.max(0, Math.round(Number(body.valueCents || 0))),
      status: optionalText(body.status, 30) || "confirmed",
    });
    return Response.json({ ok: true, ...result });
  } catch (error) { return jsonError(error); }
}
function validDate(value: unknown, label: string) { const date = new Date(requiredText(value, label, 80)); if (Number.isNaN(date.getTime())) throw new Error(`${label} non valido`); return date; }
