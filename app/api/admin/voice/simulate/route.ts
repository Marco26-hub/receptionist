import { requireApiAdmin } from "../../../../lib/api-auth";
import { getOrganizationSettings } from "../../../../lib/repository";
import { simulateVoiceAgent } from "../../../../lib/voice-ai";
import { getVoiceAdminData, recordVoiceTest } from "../../../../lib/voice-repository";
import { jsonError, readJson, requiredText } from "../../../../lib/validation";

export async function POST(request: Request) {
  const auth = await requireApiAdmin(request); if (auth.response) return auth.response;
  try {
    const body = await readJson(request);
    const scenario = requiredText(body.scenario, "Tipo di prova", 80);
    const prompt = requiredText(body.prompt, "Richiesta di prova", 800);
    const [voice, settings] = await Promise.all([getVoiceAdminData(auth.session.organizationId), getOrganizationSettings(auth.session.organizationId)]);
    const result = await simulateVoiceAgent({ businessName: settings.organization.name, language: voice.agent.language, prompt, scenario, systemPrompt: voice.agent.systemPrompt, services: voice.agent.services, faqs: voice.agent.faqs });
    const test = await recordVoiceTest({ organizationId: auth.session.organizationId, scenario, prompt, output: result.output, checks: result.checks, actorEmail: auth.session.email });
    return Response.json({ ok: true, ...result, test });
  } catch (error) { return jsonError(error); }
}
