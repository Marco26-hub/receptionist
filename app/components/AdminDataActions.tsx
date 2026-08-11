"use client";
import { useRef, useState } from "react";
import { CalendarPlus, FileUp, Plus, X } from "lucide-react";

type CustomerOption = { id: string; name: string };

export function AdminDataActions({ kind, customers = [] }: { kind: "customers" | "appointments" | "messages"; customers?: CustomerOption[] }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  if (kind === "messages") return null;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setNotice("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const payload = kind === "customers" ? {
      ...data,
      marketingConsent: data.marketingConsent === "on",
      preferredServices: String(data.preferredServices || "").split(/[|;,]/).map((item) => item.trim()).filter(Boolean),
      lifetimeValueCents: Math.round(Number(data.lifetimeValueEuros || 0) * 100),
    } : { ...data, valueCents: Math.round(Number(data.valueEuros || 0) * 100) };
    const response = await fetch(kind === "customers" ? "/api/admin/customers" : "/api/admin/appointments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json(); setBusy(false);
    if (!response.ok) return setNotice(result.error || "Operazione non riuscita");
    setNotice("Salvato correttamente"); setTimeout(() => window.location.reload(), 500);
  }

  async function importCsv(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return;
    setBusy(true); setNotice("");
    try {
      const parsed = parseCsv(await file.text());
      const rows = parsed.map((row) => ({
        firstName: row.nome || row.first_name || row.firstname,
        lastName: row.cognome || row.last_name || row.lastname,
        phone: row.telefono || row.phone,
        email: row.email,
        lastVisitAt: row.ultima_visita || row.last_visit_at || null,
        lifetimeValueCents: Math.round(Number(row.valore_totale_euro || row.lifetime_value_euros || 0) * 100),
        preferredServices: row.servizi || row.preferred_services || "",
        marketingConsent: row.consenso_marketing || row.consenso || row.marketing_consent || false,
        notes: row.note || row.notes || null,
      })).filter((row) => row.firstName && row.phone);
      if (!rows.length) throw new Error("Nessuna riga valida. Servono almeno nome e telefono.");
      const response = await fetch("/api/admin/customers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rows }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || "Importazione non riuscita");
      setNotice(`${result.imported} clienti importati`); setTimeout(() => window.location.reload(), 700);
    } catch (error) { setNotice(error instanceof Error ? error.message : "File non valido"); }
    finally { setBusy(false); if (fileRef.current) fileRef.current.value = ""; }
  }

  return <div className="admin-data-actions">
    <button className="primary-data-action" onClick={() => setOpen((value) => !value)}>{open ? <X size={17} /> : kind === "customers" ? <Plus size={17} /> : <CalendarPlus size={17} />}{open ? "Chiudi" : kind === "customers" ? "Nuovo cliente" : "Nuovo appuntamento"}</button>
    {kind === "customers" && <><button className="secondary-data-action" onClick={() => fileRef.current?.click()} disabled={busy}><FileUp size={17} />Importa CSV</button><input ref={fileRef} className="hidden-file-input" type="file" accept=".csv,text/csv" onChange={importCsv} /></>}
    {notice && <span className="data-action-notice">{notice}</span>}
    {open && <form className="inline-admin-form" onSubmit={submit}>
      {kind === "customers" ? <>
        <label>Nome<input name="firstName" required /></label><label>Cognome<input name="lastName" /></label>
        <label>Telefono<input name="phone" type="tel" required placeholder="+39..." /></label><label>Email<input name="email" type="email" /></label>
        <label>Ultima visita<input name="lastVisitAt" type="date" /></label><label>Valore storico (€)<input name="lifetimeValueEuros" type="number" min="0" step="0.01" /></label>
        <label className="wide-field">Servizi preferiti<input name="preferredServices" placeholder="Viso, laser, massaggio" /></label>
        <label className="check-field"><input name="marketingConsent" type="checkbox" />Consenso marketing registrato</label>
      </> : <>
        <label>Cliente<select name="customerId"><option value="">Nessun cliente</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label>
        <label>Servizio<input name="serviceName" required /></label><label>Inizio<input name="startsAt" type="datetime-local" required /></label><label>Fine<input name="endsAt" type="datetime-local" /></label>
        <label>Valore (€)<input name="valueEuros" type="number" min="0" step="0.01" /></label><label>Stato<select name="status"><option value="confirmed">Confermato</option><option value="pending">Da confermare</option><option value="completed">Completato</option><option value="cancelled">Annullato</option><option value="no_show">Non presentato</option></select></label>
      </>}
      <button disabled={busy}>{busy ? "Salvataggio..." : "Salva"}</button>
    </form>}
  </div>;
}

function parseCsv(text: string) {
  const delimiter = (text.split("\n")[0].match(/;/g)?.length || 0) > (text.split("\n")[0].match(/,/g)?.length || 0) ? ";" : ",";
  const rows: string[][] = []; let row: string[] = []; let value = ""; let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"' && quoted && text[index + 1] === '"') { value += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === delimiter && !quoted) { row.push(value.trim()); value = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) { if (char === "\r" && text[index + 1] === "\n") index += 1; row.push(value.trim()); if (row.some(Boolean)) rows.push(row); row = []; value = ""; }
    else value += char;
  }
  row.push(value.trim()); if (row.some(Boolean)) rows.push(row);
  const headers = (rows.shift() || []).map((header) => header.toLowerCase().trim().replace(/\s+/g, "_"));
  return rows.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] || ""])));
}
