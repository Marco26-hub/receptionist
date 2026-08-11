import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { signValue, verifySignedValue } from "./security";

const COOKIE_NAME = "agendapiena_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 12;

export type AdminSession = {
  email: string;
  organizationId: string;
  memberId: string | null;
  role: "owner" | "manager" | "staff";
  expiresAt: number;
};

function sessionSecret() {
  if (process.env.SESSION_SECRET && (process.env.NODE_ENV !== "production" || process.env.SESSION_SECRET.length >= 32)) return process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === "production" && process.env.SESSION_SECRET) throw new Error("SESSION_SECRET deve avere almeno 32 caratteri");
  if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET non configurato");
  return "local-development-secret-change-me";
}

export async function createAdminSession(input: Omit<AdminSession, "expiresAt">) {
  const payload: AdminSession = { ...input, expiresAt: Date.now() + SESSION_DURATION_SECONDS * 1000 };
  const token = await signValue(JSON.stringify(payload), sessionSecret());
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: SESSION_DURATION_SECONDS });
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  let decoded: string | null = null;
  try { decoded = await verifySignedValue(token, sessionSecret()); } catch { return null; }
  if (!decoded) return null;
  try {
    const session = JSON.parse(decoded) as AdminSession;
    if (!session.email || !session.organizationId || !session.role) return null;
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
