import { requireApiAdmin } from "../../../../lib/api-auth";
import { connectCalcom, disconnectCalcom } from "../../../../lib/calcom";
import { jsonError, readJson, requiredText, ValidationError } from "../../../../lib/validation";

export async function POST(request: Request) {
  const auth = await requireApiAdmin(request); if (auth.response) return auth.response;
  try {
    if (auth.session.role === "staff") throw new ValidationError("Serve un proprietario o responsabile per collegare il calendario");
    const body = await readJson(request);
    const status = await connectCalcom({ organizationId: auth.session.organizationId, actorEmail: auth.session.email, apiKey: requiredText(body.apiKey, "Chiave Cal.com", 500), eventTypeId: Number(body.eventTypeId) });
    return Response.json({ ok: true, status });
  } catch (error) { return jsonError(error); }
}

export async function DELETE(request: Request) {
  const auth = await requireApiAdmin(request); if (auth.response) return auth.response;
  try {
    if (auth.session.role === "staff") throw new ValidationError("Serve un proprietario o responsabile per scollegare il calendario");
    await disconnectCalcom(auth.session.organizationId, auth.session.email);
    return Response.json({ ok: true });
  } catch (error) { return jsonError(error); }
}
