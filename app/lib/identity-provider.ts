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

export async function inviteSupabaseUser(email: string) {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Inviti non configurati: aggiungi SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY su Render");
  const redirectTo = `${(process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "")}/accesso/imposta-password`;
  const response = await fetch(`${url}/auth/v1/invite`, {
    method: "POST",
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email, redirect_to: redirectTo }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(response.status === 422 ? "Questo indirizzo risulta già registrato" : "Supabase non ha inviato l’invito");
  return { invited: true };
}
