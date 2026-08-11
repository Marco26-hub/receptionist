"use client";
import { useState } from "react";
import { ArrowRight, LockKeyhole } from "lucide-react";

export function LoginForm({ returnTo = "/admin" }: { returnTo?: string }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    const data = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: data.get("email"), password: data.get("password") }) });
    const result = await response.json();
    if (!response.ok) { setError(result.error || "Accesso non riuscito"); setLoading(false); return; }
    window.location.href = returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/admin";
  }
  const development = process.env.NODE_ENV !== "production";
  return <form className="auth-form" onSubmit={submit}><div className="auth-icon"><LockKeyhole size={20} /></div><label>Email<input name="email" type="email" autoComplete="email" defaultValue={development ? "admin@agendapiena.ai" : ""} required /></label><label>Password<input name="password" type="password" autoComplete="current-password" placeholder="La tua password" required /></label>{error && <p className="form-error" role="alert">{error}</p>}<button disabled={loading}>{loading ? "Accesso in corso…" : "Accedi"}<ArrowRight size={17} /></button>{development && <small>Usa le credenziali configurate per l’ambiente locale.</small>}</form>;
}
