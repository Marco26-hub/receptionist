import { requireApiAdmin } from "../../../../lib/api-auth";
import { createRetellWebCall, syncAndPublishRetellAgent } from "../../../../lib/retell";
import { getVoiceAdminData } from "../../../../lib/voice-repository";
import { jsonError, ValidationError } from "../../../../lib/validation";
export async function POST(request: Request) {
  const auth = await requireApiAdmin(request); if (auth.response) return auth.response;
  try {
    const data = await getVoiceAdminData(auth.session.organizationId);
    if (!data.agent.retellAgentId) throw new ValidationError("Collega prima un assistente Retell");
    await syncAndPublishRetellAgent({ agentId: data.agent.retellAgentId, name: data.agent.name, voiceId: data.agent.voiceId, language: data.agent.language, greeting: data.agent.greeting, systemPrompt: data.agent.systemPrompt, services: data.agent.services, faqs: data.agent.faqs, transferNumber: data.agent.transferNumber, bookingEnabled: data.agent.bookingEnabled, recordingEnabled: data.agent.recordingEnabled });
    return Response.json({ ok: true, ...(await createRetellWebCall(data.agent.retellAgentId)) });
  } catch (error) { return jsonError(error); }
}
