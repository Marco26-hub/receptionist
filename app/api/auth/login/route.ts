import { createAdminSession } from "../../../lib/auth";
import { safeEqual } from "../../../lib/security";
import { jsonError, readJson, requiredText, validEmail } from "../../../lib/validation";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const email = validEmail(body.email);
    const password = requiredText(body.password, "Password", 200);
    const configuredEmail = (process.env.ADMIN_EMAIL || "demo@agendapiena.ai").toLowerCase();
    const configuredPassword = process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === "production" ? "" : "AgendaPienaDemo2026!");
    if (!configuredPassword || !safeEqual(email, configuredEmail) || !safeEqual(password, configuredPassword)) return Response.json({ ok: false, error: "Credenziali non valide" }, { status: 401 });
    await createAdminSession(email);
    return Response.json({ ok: true });
  } catch (error) { return jsonError(error); }
}

