import { createAdminSession } from "../../../lib/auth";
import { authenticateIdentity } from "../../../lib/identity-provider";
import { resolveAdminIdentity } from "../../../lib/repository";
import { jsonError, readJson, requiredText, validEmail } from "../../../lib/validation";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const email = validEmail(body.email);
    const password = requiredText(body.password, "Password", 200);
    if (!(await authenticateIdentity(email, password))) return Response.json({ ok: false, error: "Credenziali non valide" }, { status: 401 });
    const identity = await resolveAdminIdentity(email);
    if (!identity) return Response.json({ ok: false, error: "Utente non associato a un'attività" }, { status: 403 });
    await createAdminSession({ email, ...identity });
    return Response.json({ ok: true });
  } catch (error) { return jsonError(error); }
}
