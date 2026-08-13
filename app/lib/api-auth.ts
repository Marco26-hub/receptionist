import { getAdminSession } from "./auth";

export async function requireApiAdmin(request?: Request) {
  const session = await getAdminSession();
  if (!session) return { session: null, response: Response.json({ ok: false, error: "Non autorizzato" }, { status: 401 }) };
  if (request && !isSameOrigin(request)) return { session: null, response: Response.json({ ok: false, error: "Origine richiesta non valida" }, { status: 403 }) };
  return { session, response: null };
}

function isSameOrigin(request: Request) {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return true;
  const origin = request.headers.get("origin");
  if (!origin) return process.env.NODE_ENV !== "production";
  const requestOrigin = new URL(request.url).origin;
  if (process.env.NODE_ENV !== "production" && origin === requestOrigin) return true;
  const expected = process.env.NEXT_PUBLIC_SITE_URL || requestOrigin;
  return origin === new URL(expected).origin;
}
