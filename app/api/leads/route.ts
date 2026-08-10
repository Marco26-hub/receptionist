import { createLead } from "../../lib/repository";
import { jsonError, optionalText, readJson, requiredText, validEmail } from "../../lib/validation";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    if (body.website) return Response.json({ ok: true });
    const lead = await createLead({ centerName: requiredText(body.centerName, "Nome del centro"), contactName: requiredText(body.contactName, "Nome"), email: validEmail(body.email), phone: optionalText(body.phone, 40), city: optionalText(body.city, 100), monthlyAppointments: optionalText(body.monthlyAppointments, 50), source: optionalText(body.source, 100) || "website" });
    return Response.json({ ok: true, leadId: lead.id, demo: lead.demo }, { status: 201 });
  } catch (error) { return jsonError(error); }
}

