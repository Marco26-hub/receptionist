import { createAdminSession } from "../../../../lib/auth";
import { requireApiAdmin } from "../../../../lib/api-auth";
import { membershipForOrganization } from "../../../../lib/platform-admin";
import { jsonError, readJson, requiredText, ValidationError } from "../../../../lib/validation";

export async function POST(request: Request) {
  const auth = await requireApiAdmin(request); if (auth.response) return auth.response;
  try {
    const body = await readJson(request);
    const membership = await membershipForOrganization(auth.session.email, requiredText(body.organizationId, "Attività", 100));
    if (!membership) throw new ValidationError("Non hai accesso a questa attività");
    await createAdminSession({ email: auth.session.email, organizationId: membership.organizationId, memberId: membership.memberId, role: membership.role });
    return Response.json({ ok: true });
  } catch (error) { return jsonError(error); }
}
