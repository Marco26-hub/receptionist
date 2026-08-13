import { requireApiAdmin } from "../../../lib/api-auth";
import { inviteSupabaseUser } from "../../../lib/identity-provider";
import { createPlatformOrganization, getPlatformOrganizations, isPlatformAdminEmail, platformProvisioningReady } from "../../../lib/platform-admin";
import { jsonError, optionalText, readJson, requiredText, validEmail, ValidationError } from "../../../lib/validation";

export async function GET(request: Request) {
  const auth = await requireApiAdmin(request); if (auth.response) return auth.response;
  if (!isPlatformAdminEmail(auth.session.email)) return Response.json({ ok: false, error: "Non autorizzato" }, { status: 403 });
  return Response.json({ ok: true, organizations: await getPlatformOrganizations(), provisioningReady: platformProvisioningReady() });
}

export async function POST(request: Request) {
  const auth = await requireApiAdmin(request); if (auth.response) return auth.response;
  try {
    if (!isPlatformAdminEmail(auth.session.email)) return Response.json({ ok: false, error: "Non autorizzato" }, { status: 403 });
    if (!platformProvisioningReady()) throw new ValidationError("Prima configura Supabase Auth e la chiave di servizio su Render");
    const body = await readJson(request);
    const input = {
      name: requiredText(body.name, "Nome attività", 150),
      city: optionalText(body.city, 100),
      ownerName: requiredText(body.ownerName, "Nome proprietario", 120),
      ownerEmail: validEmail(body.ownerEmail),
      actorEmail: auth.session.email,
    };
    let invitation: "sent" | "already_registered" = "sent";
    try { await inviteSupabaseUser(input.ownerEmail); }
    catch (error) {
      if (error instanceof Error && error.message.includes("già registrato")) invitation = "already_registered";
      else throw new ValidationError(error instanceof Error ? error.message : "Invito non riuscito");
    }
    const created = await createPlatformOrganization(input);
    return Response.json({ ok: true, invitation, organization: created.organization, owner: created.owner }, { status: 201 });
  } catch (error) { return jsonError(error); }
}
