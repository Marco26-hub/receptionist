"use client";

import { Check, KeyRound, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function SetPasswordForm({ supabaseUrl, anonKey }: { supabaseUrl: string; anonKey: string }) {
  const [notice, setNotice] = useState(""); const [busy, setBusy] = useState(false); const [done, setDone] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setNotice(""); const form = new FormData(event.currentTarget); const password = String(form.get("password") || "");
    const token = new URLSearchParams(window.location.hash.slice(1)).get("access_token") || "";
    if (password.length < 12) { setBusy(false); setNotice("Usa almeno 12 caratteri."); return; }
    if (password !== form.get("confirmPassword")) { setBusy(false); setNotice("Le password non coincidono."); return; }
    if (!token || !supabaseUrl || !anonKey) { setBusy(false); setNotice("Invito non valido o scaduto. Chiedi un nuovo invito."); return; }
    const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/auth/v1/user`, { method: "PUT", headers: { apikey: anonKey, Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    setBusy(false); if (!response.ok) { setNotice("Non siamo riusciti a impostare la password. L’invito potrebbe essere scaduto."); return; }
    window.history.replaceState({}, "", window.location.pathname); setDone(true);
  }
  if (done) return <div className="set-password-done"><Check size={25} /><h2>Accesso pronto</h2><p>Ora puoi entrare con email e nuova password.</p><Link href="/accesso">Vai all’accesso</Link></div>;
  return <form className="auth-form" onSubmit={submit}><div className="auth-icon"><KeyRound size={20} /></div><label>Nuova password<input type="password" name="password" minLength={12} required autoComplete="new-password" /></label><label>Ripeti la password<input type="password" name="confirmPassword" minLength={12} required autoComplete="new-password" /></label>{notice && <p className="form-error">{notice}</p>}<button disabled={busy}>{busy ? <LoaderCircle className="spin" size={18} /> : <KeyRound size={18} />} Imposta password</button><small>Usa almeno 12 caratteri e non riutilizzare password di altri servizi.</small></form>;
}
