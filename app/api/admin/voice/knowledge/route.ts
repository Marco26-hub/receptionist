import { PDFParse } from "pdf-parse";
import { requireApiAdmin } from "../../../../lib/api-auth";
import { getOrganizationSettings } from "../../../../lib/repository";
import { analyzeVoiceKnowledge } from "../../../../lib/voice-ai";
import { getVoiceAdminData } from "../../../../lib/voice-repository";
import { jsonError, ValidationError } from "../../../../lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireApiAdmin(request); if (auth.response) return auth.response;
  try {
    const form = await request.formData();
    const file = form.get("file");
    const notes = String(form.get("notes") || "").trim();
    let sourceName = "Intervista guidata";
    let text = notes;
    if (file instanceof File && file.size) {
      if (file.size > 5 * 1024 * 1024) throw new ValidationError("Il file supera 5 MB");
      sourceName = file.name.slice(0, 180);
      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        const parser = new PDFParse({ data: new Uint8Array(await file.arrayBuffer()) });
        try { text = `${(await parser.getText()).text}\n${notes}`.trim(); } finally { await parser.destroy(); }
      } else if (file.type.startsWith("text/") || /\.(txt|csv)$/i.test(file.name)) text = `${await file.text()}\n${notes}`.trim();
      else throw new ValidationError("Carica un PDF, TXT o CSV");
    }
    if (text.length < 30) throw new ValidationError("Inserisci almeno qualche informazione utile sull’attività");
    if (text.length > 60_000) text = text.slice(0, 60_000);
    const [voice, settings] = await Promise.all([getVoiceAdminData(auth.session.organizationId), getOrganizationSettings(auth.session.organizationId)]);
    const proposal = await analyzeVoiceKnowledge({ businessName: settings.organization.name, language: voice.agent.language, sourceName, text });
    return Response.json({ ok: true, source: { name: sourceName, characters: text.length }, proposal });
  } catch (error) { return jsonError(error); }
}
