"use client";
import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";

export function LeadForm({ source = "website" }: { source?: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setStatus("loading"); setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
    const result = await response.json();
    if (!response.ok) { setStatus("error"); setError(result.error || "Non siamo riusciti a inviare la richiesta"); return; }
    setStatus("success"); event.currentTarget.reset();
  }
  if (status === "success") return <div className="form-success"><Check size={22} /><h2>Richiesta ricevuta.</h2><p>Ti contatteremo per capire se AgendaPiena è adatta al tuo centro.</p></div>;
  return <form className="lead-form" onSubmit={submit}><input type="hidden" name="source" value={source} /><input className="honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" /><div className="form-row"><label>Il tuo nome<input name="contactName" autoComplete="name" required /></label><label>Nome del centro<input name="centerName" autoComplete="organization" required /></label></div><div className="form-row"><label>Email<input name="email" type="email" autoComplete="email" required /></label><label>Telefono<input name="phone" type="tel" autoComplete="tel" /></label></div><div className="form-row"><label>Città<input name="city" autoComplete="address-level2" /></label><label>Appuntamenti al mese<select name="monthlyAppointments" defaultValue=""><option value="" disabled>Seleziona</option><option value="meno-di-100">Meno di 100</option><option value="100-300">100 - 300</option><option value="oltre-300">Oltre 300</option></select></label></div>{status === "error" && <p className="form-error">{error}</p>}<button disabled={status === "loading"}>{status === "loading" ? "Invio…" : "Richiedi la valutazione"}<ArrowRight size={17} /></button><small>Inviando accetti di essere ricontattato in merito alla richiesta. Nessuna newsletter automatica.</small></form>;
}
