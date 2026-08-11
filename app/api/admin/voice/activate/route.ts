import { requireApiAdmin } from "../../../../lib/api-auth";
import { setRetellPhoneActive, syncAndPublishRetellAgent } from "../../../../lib/retell";
import { getVoiceAdminData, setVoiceAgentLive } from "../../../../lib/voice-repository";
import { jsonError, ValidationError } from "../../../../lib/validation";

export async function POST(request: Request) {
  const auth = await requireApiAdmin(request); if (auth.response) return auth.response;
  try {
    const data = await getVoiceAdminData(auth.session.organizationId);
    if (!data.agent.retellAgentId) throw new ValidationError("Inserisci prima il codice dell’assistente Retell nelle impostazioni avanzate");
    if (!data.agent.retellPhoneNumber) throw new ValidationError("Inserisci prima il numero Retell da attivare");
    await syncAndPublishRetellAgent({ agentId: data.agent.retellAgentId, name: data.agent.name, voiceId: data.agent.voiceId, language: data.agent.language, greeting: data.agent.greeting, systemPrompt: data.agent.systemPrompt, services: data.agent.services, faqs: data.agent.faqs, transferNumber: data.agent.transferNumber, bookingEnabled: data.agent.bookingEnabled, recordingEnabled: data.agent.recordingEnabled });
    await setRetellPhoneActive(data.agent.retellPhoneNumber, data.agent.retellAgentId, true);
    const agent = await setVoiceAgentLive(auth.session.organizationId, auth.session.email);
    return Response.json({ ok: true, agent });
  } catch (error) { return jsonError(error); }
}
