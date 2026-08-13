import { requireApiAdmin } from "../../../lib/api-auth";
import { inviteSupabaseUser } from "../../../lib/identity-provider";
import { addTeamMember, getTeamMembers, updateTeamMember } from "../../../lib/repository";
import { jsonError, readJson, requiredText, validEmail, ValidationError } from "../../../lib/validation";

export async function GET(request: Request) {
  const auth = await requireApiAdmin(request); if (auth.response) return auth.response;
  return Response.json({ ok: true, members: await getTeamMembers(auth.session.organizationId) });
}

export async function POST(request: Request) {
  const auth = await requireApiAdmin(request); if (auth.response) return auth.response;
  try {
    if (auth.session.role !== "owner") throw new ValidationError("Solo il proprietario può invitare utenti");
    const body = await readJson(request);
    const email = validEmail(body.email);
    const role = allowedRole(body.role);
    try { await inviteSupabaseUser(email); } catch (error) { throw new ValidationError(error instanceof Error ? error.message : "Invito non riuscito"); }
    const member = await addTeamMember({ organizationId: auth.session.organizationId, email, name: requiredText(body.name, "Nome", 120), role, actorEmail: auth.session.email });
    return Response.json({ ok: true, member }, { status: 201 });
  } catch (error) { return jsonError(error); }
}

export async function PATCH(request: Request) {
  const auth = await requireApiAdmin(request); if (auth.response) return auth.response;
  try {
    if (auth.session.role !== "owner") throw new ValidationError("Solo il proprietario può modificare il team");
    const body = await readJson(request);
    const member = await updateTeamMember({ organizationId: auth.session.organizationId, memberId: requiredText(body.id, "Utente", 100), active: body.active !== false, role: optionalRole(body.role), actorEmail: auth.session.email });
    return Response.json({ ok: true, member });
  } catch (error) { return jsonError(error); }
}

function allowedRole(value: unknown): "manager" | "staff" {
  if (value === "manager" || value === "staff") return value;
  throw new ValidationError("Scegli Responsabile oppure Collaboratore");
}

function optionalRole(value: unknown): "manager" | "staff" | undefined {
  return value === undefined ? undefined : allowedRole(value);
}
