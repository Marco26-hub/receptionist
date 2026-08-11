import { requireApiAdmin } from "../../../lib/api-auth";
import { updateOrganizationSettings } from "../../../lib/repository";
import { jsonError, optionalText, readJson, requiredText } from "../../../lib/validation";
export async function POST(request: Request) {
  const auth = await requireApiAdmin(request); if (auth.response) return auth.response;
  try {
    const body = await readJson(request);
    const openingHour = bounded(body.openingHour, 0, 22, 9);
    const closingHour = bounded(body.closingHour, openingHour + 1, 24, 19);
    const slotMinutes = bounded(body.slotMinutes, 30, 240, 60);
    const workingDays = Array.isArray(body.workingDays) ? body.workingDays.map(Number).filter((day) => day >= 0 && day <= 6) : [1, 2, 3, 4, 5, 6];
    const result = await updateOrganizationSettings(auth.session.organizationId, { name: requiredText(body.name, "Nome attività", 150), city: optionalText(body.city, 100), toneOfVoice: requiredText(body.toneOfVoice, "Tono di voce", 300), averageTicketCents: Math.max(0, Math.round(Number(body.averageTicketCents || 0))), settings: { openingHour, closingHour, slotMinutes, workingDays } });
    return Response.json(result);
  } catch (error) { return jsonError(error); }
}
function bounded(value: unknown, min: number, max: number, fallback: number) { const parsed = Number(value); return Number.isFinite(parsed) ? Math.max(min, Math.min(max, Math.round(parsed))) : fallback; }
