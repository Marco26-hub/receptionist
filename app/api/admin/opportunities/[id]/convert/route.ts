import { requireApiAdmin } from "../../../../../lib/api-auth";
import { convertOpportunity } from "../../../../../lib/repository";
import { jsonError, optionalText, readJson } from "../../../../../lib/validation";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiAdmin(request); if (auth.response) return auth.response;
  try { const { id } = await params; const body = await readJson(request); const startsAt = body.startsAt ? new Date(String(body.startsAt)) : undefined; if (startsAt && Number.isNaN(startsAt.getTime())) return Response.json({ ok: false, error: "Data non valida" }, { status: 400 }); return Response.json(await convertOpportunity({ organizationId: auth.session.organizationId, opportunityId: id, actorEmail: auth.session.email, startsAt, serviceName: optionalText(body.serviceName, 150) || undefined, valueCents: body.valueCents == null ? undefined : Math.max(0, Math.round(Number(body.valueCents))) })); } catch (error) { return jsonError(error); }
}
