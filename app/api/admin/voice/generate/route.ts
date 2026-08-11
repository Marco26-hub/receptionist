import { requireApiAdmin } from "../../../../lib/api-auth";
import { getOrganizationSettings } from "../../../../lib/repository";
import { generateVoiceAgentWithAI } from "../../../../lib/voice-ai";
import { getVoiceCategory } from "../../../../lib/voice-categories";
import { getVoiceAdminData, saveGeneratedVoiceAgent } from "../../../../lib/voice-repository";
import { jsonError } from "../../../../lib/validation";

export async function POST(request: Request) {
  const auth = await requireApiAdmin(request); if (auth.response) return auth.response;
  try {
    const [voice, settings] = await Promise.all([getVoiceAdminData(auth.session.organizationId), getOrganizationSettings(auth.session.organizationId)]);
    const category = getVoiceCategory(voice.agent.category);
    const generated = await generateVoiceAgentWithAI({ businessName: settings.organization.name, tone: settings.organization.toneOfVoice, language: voice.agent.language, categoryLabel: category.label, categoryRules: category.rules, services: voice.agent.services, currentFaqs: voice.agent.faqs });
    const saved = await saveGeneratedVoiceAgent(auth.session.organizationId, generated, auth.session.email);
    return Response.json({ ok: true, agent: saved, provider: generated.provider });
  } catch (error) { return jsonError(error); }
}
