import { requireApiAdmin } from "../../../../lib/api-auth";
import { getVoiceAdminData, saveVoiceAgent } from "../../../../lib/voice-repository";
import { jsonError, optionalText, readJson, requiredText } from "../../../../lib/validation";

export async function GET(request: Request) {
  const auth = await requireApiAdmin(request); if (auth.response) return auth.response;
  return Response.json({ ok: true, data: await getVoiceAdminData(auth.session.organizationId) });
}

export async function POST(request: Request) {
  const auth = await requireApiAdmin(request); if (auth.response) return auth.response;
  try {
    const body = await readJson(request);
    const services = Array.isArray(body.services) ? body.services.slice(0, 50).map((item) => {
      const row = item as Record<string, unknown>;
      return { name: requiredText(row.name, "Nome servizio", 150), durationMinutes: bounded(row.durationMinutes, 15, 480, 60), priceCents: bounded(row.priceCents, 0, 10_000_000, 0), enabled: row.enabled !== false };
    }) : [];
    const faqs = Array.isArray(body.faqs) ? body.faqs.slice(0, 50).map((item) => {
      const row = item as Record<string, unknown>;
      return { question: requiredText(row.question, "Domanda", 200), answer: requiredText(row.answer, "Risposta", 1000) };
    }) : [];
    const result = await saveVoiceAgent(auth.session.organizationId, {
      name: requiredText(body.name, "Nome assistente", 120),
      category: requiredText(body.category, "Categoria", 60),
      language: allowedLanguage(body.language),
      greeting: requiredText(body.greeting, "Saluto iniziale", 300),
      systemPrompt: requiredText(body.systemPrompt, "Istruzioni", 10_000),
      services,
      faqs,
      transferNumber: optionalText(body.transferNumber, 40),
      bookingEnabled: body.bookingEnabled !== false,
      recordingEnabled: body.recordingEnabled === true,
      voiceId: requiredText(body.voiceId, "Voce", 100),
      retellAgentId: optionalText(body.retellAgentId, 150),
      retellPhoneNumber: optionalText(body.retellPhoneNumber, 40),
    }, auth.session.email);
    return Response.json({ ok: true, agent: result });
  } catch (error) { return jsonError(error); }
}

function bounded(value: unknown, min: number, max: number, fallback: number) {
  const parsed = Number(value); return Number.isFinite(parsed) ? Math.max(min, Math.min(max, Math.round(parsed))) : fallback;
}

function allowedLanguage(value: unknown) {
  const language = typeof value === "string" ? value : "it-IT";
  return ["it-IT", "en-US", "it-IT,en-US"].includes(language) ? language : "it-IT";
}
