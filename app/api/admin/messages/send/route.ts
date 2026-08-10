import { requireApiAdmin } from "../../../../lib/api-auth";
import { sendWhatsAppText } from "../../../../lib/whatsapp";
import { jsonError, readJson, requiredText } from "../../../../lib/validation";
export async function POST(request: Request) { const auth = await requireApiAdmin(); if (auth.response) return auth.response; try { const body = await readJson(request); const result = await sendWhatsAppText({ to: requiredText(body.to, "Telefono", 40), body: requiredText(body.body, "Messaggio", 1200) }); return Response.json({ ok: true, ...result }); } catch (error) { return jsonError(error); } }
