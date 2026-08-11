import { requireApiAdmin } from "../../../../lib/api-auth";
import { markVoiceAgentReady } from "../../../../lib/voice-repository";
import { jsonError } from "../../../../lib/validation";
export async function POST(request: Request) { const auth = await requireApiAdmin(request); if (auth.response) return auth.response; try { return Response.json(await markVoiceAgentReady(auth.session.organizationId, auth.session.email)); } catch (error) { return jsonError(error); } }
