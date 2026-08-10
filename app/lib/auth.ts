import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { signValue, verifySignedValue } from "./security";

const COOKIE_NAME = "agendapiena_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 12;

export type AdminSession = { email: string; expiresAt: number };

function sessionSecret() {
  return process.env.SESSION_SECRET || "local-development-secret-change-me";
}

export async function createAdminSession(email: string) {
  const payload: AdminSession = { email, expiresAt: Date.now() + SESSION_DURATION_SECONDS * 1000 };
  const token = await signValue(JSON.stringify(payload), sessionSecret());
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: SESSION_DURATION_SECONDS });
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const decoded = await verifySignedValue(token, sessionSecret());
  if (!decoded) return null;
  try {
    const session = JSON.parse(decoded) as AdminSession;
    return session.expiresAt > Date.now() ? session : null;
  } catch { return null; }
}

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) redirect("/accesso?returnTo=/admin");
  return session;
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

