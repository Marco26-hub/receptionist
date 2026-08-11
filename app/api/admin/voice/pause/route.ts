import { requireApiAdmin } from "../../../../lib/api-auth";
import { setRetellPhoneActive } from "../../../../lib/retell";
import { getVoiceAdminData, pauseVoiceAgent } from "../../../../lib/voice-repository";
import { jsonError, ValidationError } from "../../../../lib/validation";

export async function POST(request: Request) {
  const auth = await requireApiAdmin(request); if (auth.response) return auth.response;
  try {
    const data = await getVoiceAdminData(auth.session.organizationId);
    if (data.agent.status === "live") {
      if (!data.agent.retellAgentId || !data.agent.retellPhoneNumber) throw new ValidationError("Mancano i dati Retell per scollegare il numero in sicurezza");
      await setRetellPhoneActive(data.agent.retellPhoneNumber, data.agent.retellAgentId, false);
    }
    return Response.json(await pauseVoiceAgent(auth.session.organizationId, auth.session.email));
  } catch (error) { return jsonError(error); }
}
