import { safeEqual } from "./security";

export async function authenticateIdentity(email: string, password: string) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  if (supabaseUrl && supabaseAnonKey) {
    const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });
    if (!response.ok) return false;
    const result = await response.json() as { user?: { email?: string } };
    return result.user?.email?.toLowerCase() === email;
  }

  const configuredEmail = (process.env.ADMIN_EMAIL || "demo@agendapiena.ai").toLowerCase();
  const configuredPassword = process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === "production" ? "" : "AgendaPienaDemo2026!");
  return Boolean(configuredPassword && safeEqual(email, configuredEmail) && safeEqual(password, configuredPassword));
}
