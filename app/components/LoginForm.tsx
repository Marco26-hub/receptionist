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
  return <form className="auth-form" onSubmit={submit}><div className="auth-icon"><LockKeyhole size={20} /></div><label>Email<input name="email" type="email" autoComplete="email" defaultValue="demo@agendapiena.ai" required /></label><label>Password<input name="password" type="password" autoComplete="current-password" placeholder="La tua password" required /></label>{error && <p className="form-error" role="alert">{error}</p>}<button disabled={loading}>{loading ? "Accesso…" : "Entra nell’atelier"}<ArrowRight size={17} /></button><small>In locale: demo@agendapiena.ai / AgendaPienaDemo2026!</small></form>;
}

