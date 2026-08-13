"use client";

import { useState } from "react";
import { Archive, ChevronLeft, Download, Eraser, FileClock, Play, Save, ShieldCheck, TriangleAlert } from "lucide-react";

type PrivacyData = {
  policy: { messageContentDays: number; voiceTranscriptDays: number; recordingDays: number; auditLogDays: number };
  customers: Array<{ id: string; name: string; phone: string; email: string | null; doNotContact: boolean }>;
  requests: Array<{ id: string; customerId: string | null; requestType: string; status: string; requestedBy: string; completedAt: string | null; createdAt: string }>;
  lastRunAt: string | null;
  mode: "demo" | "live";
};

const requestLabels: Record<string, string> = { organization_export: "Esportazione attività", customer_export: "Esportazione cliente", customer_erasure: "Anonimizzazione cliente" };

export function PrivacyAdmin({ initialData, role }: { initialData: PrivacyData; role: "owner" | "manager" | "staff" }) {
  const [policy, setPolicy] = useState(initialData.policy);
  const [customers, setCustomers] = useState(initialData.customers);
  const [customerId, setCustomerId] = useState(initialData.customers[0]?.id || "");
  const [confirmation, setConfirmation] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const owner = role === "owner";
  const canExportCustomer = role !== "staff";

  async function savePolicy(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy("save"); setNotice("");
    const response = await fetch("/api/admin/privacy/retention", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(policy) });
    const result = await response.json(); setBusy("");
    setNotice(response.ok ? "Tempi di conservazione salvati per questa attività." : result.error || "Salvataggio non riuscito");
  }

  async function runCleanup() {
    setBusy("cleanup"); setNotice("");
    const response = await fetch("/api/admin/privacy/retention", { method: "POST" });
    const result = await response.json(); setBusy("");
    if (!response.ok) return setNotice(result.error || "Pulizia non riuscita");
    const counts = result.result;
    setNotice(`Pulizia completata: ${counts.messages} messaggi, ${counts.transcripts} trascrizioni e ${counts.recordings} registrazioni rimossi.`);
  }

  async function download(scope: "organization" | "customer") {
    setBusy(scope); setNotice("");
    const response = await fetch("/api/admin/privacy/export", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scope, customerId: scope === "customer" ? customerId : undefined }) });
    if (!response.ok) { const result = await response.json(); setBusy(""); return setNotice(result.error || "Esportazione non riuscita"); }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = response.headers.get("content-disposition")?.match(/filename="([^"]+)"/)?.[1] || "dati-agendapiena.json";
    link.click(); URL.revokeObjectURL(url); setBusy("");
    setNotice("File preparato e scaricato. L’operazione è stata registrata.");
  }

  async function eraseCustomer() {
    if (!customerId) return setNotice("Scegli un cliente.");
    setBusy("erase"); setNotice("");
    const response = await fetch("/api/admin/privacy/erase", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customerId, confirmation }) });
    const result = await response.json(); setBusy("");
    if (!response.ok) return setNotice(result.error || "Anonimizzazione non riuscita");
    setCustomers((items) => items.map((item) => item.id === customerId ? { ...item, name: "Cliente eliminato", phone: "Dato eliminato", email: null, doNotContact: true } : item));
    setConfirmation(""); setNotice("Cliente reso anonimo. Statistiche e valori economici restano disponibili senza dati personali.");
  }

  function updatePolicy(key: keyof typeof policy, value: string) {
    setPolicy((current) => ({ ...current, [key]: Number(value) }));
  }

  return <main className="privacy-admin-page">
    <a href="/admin/impostazioni"><ChevronLeft size={17} />Torna alle impostazioni</a>
    <header><div><span>Dati e privacy</span><h1>Controllo semplice dei dati.</h1><p>Ogni operazione riguarda soltanto l’attività aperta in questo momento.</p></div><ShieldCheck size={34} /></header>
    <section className="privacy-safety"><ShieldCheck size={21} /><div><strong>Protezione multicliente attiva</strong><p>Export, pulizia e anonimizzazione usano sempre l’identificativo dell’azienda collegata. Le chiavi di WhatsApp, calendario e altri servizi non entrano mai nei file esportati.</p></div></section>

    <section className="privacy-grid">
      <form className="privacy-panel" onSubmit={savePolicy}>
        <header><FileClock size={22} /><div><span>Conservazione</span><h2>Per quanto tempo teniamo i dati</h2></div></header>
        <label>Testo dei messaggi<input type="number" min="30" max="1825" value={policy.messageContentDays} onChange={(event) => updatePolicy("messageContentDays", event.target.value)} disabled={!owner} /><small>Dopo questi giorni resta l’esito, ma viene eliminato il testo.</small></label>
        <label>Trascrizioni delle chiamate<input type="number" min="7" max="730" value={policy.voiceTranscriptDays} onChange={(event) => updatePolicy("voiceTranscriptDays", event.target.value)} disabled={!owner} /><small>Elimina conversazione, riepilogo e numeri associati.</small></label>
        <label>Registrazioni audio<input type="number" min="1" max="365" value={policy.recordingDays} onChange={(event) => updatePolicy("recordingDays", event.target.value)} disabled={!owner} /><small>L’audio è già disattivato finché il proprietario non lo abilita.</small></label>
        <label>Registro delle attività<input type="number" min="365" max="3650" value={policy.auditLogDays} onChange={(event) => updatePolicy("auditLogDays", event.target.value)} disabled={!owner} /><small>Serve per ricostruire accessi e operazioni importanti.</small></label>
        <div className="privacy-actions"><button disabled={!owner || Boolean(busy)}><Save size={16} />{busy === "save" ? "Salvataggio..." : "Salva tempi"}</button><button className="secondary" type="button" onClick={runCleanup} disabled={!owner || Boolean(busy)}><Play size={16} />{busy === "cleanup" ? "Pulizia..." : "Esegui ora"}</button></div>
        {!owner && <p className="privacy-permission">Solo il proprietario può cambiare questi valori.</p>}
        <p className="privacy-last-run">Ultima pulizia: {initialData.lastRunAt ? new Date(initialData.lastRunAt).toLocaleString("it-IT") : "non ancora eseguita"}. La pulizia viene controllata ogni giorno.</p>
      </form>

      <section className="privacy-panel">
        <header><Download size={22} /><div><span>Esportazione</span><h2>Scarica una copia leggibile</h2></div></header>
        <div className="privacy-export-block"><strong>Tutta l’attività</strong><p>Include clienti, agenda, messaggi, chiamate, configurazioni senza segreti e registro delle operazioni.</p><button type="button" onClick={() => download("organization")} disabled={!owner || Boolean(busy)}><Archive size={16} />{busy === "organization" ? "Preparazione..." : "Scarica tutti i dati"}</button>{!owner && <small>Disponibile soltanto al proprietario.</small>}</div>
        <div className="privacy-export-block"><strong>Un singolo cliente</strong><p>Crea il file da consegnare quando una persona chiede una copia dei propri dati.</p><select aria-label="Cliente da esportare" value={customerId} onChange={(event) => setCustomerId(event.target.value)}><option value="">Scegli un cliente</option>{customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.name} · {customer.phone}</option>)}</select><button type="button" onClick={() => download("customer")} disabled={!canExportCustomer || !customerId || Boolean(busy)}><Download size={16} />{busy === "customer" ? "Preparazione..." : "Scarica dati cliente"}</button></div>
      </section>
    </section>

    <section className="privacy-danger">
      <header><TriangleAlert size={23} /><div><span>Richiesta di cancellazione</span><h2>Rendi anonimo un cliente</h2><p>Rimuove nome, contatti, messaggi, trascrizioni e registrazioni da AgendaPiena. Mantiene soltanto dati anonimi utili a contabilità e statistiche. Le copie presenti nei servizi esterni collegati vanno eliminate anche lì. Non si può annullare.</p></div></header>
      <div><select aria-label="Cliente da rendere anonimo" value={customerId} onChange={(event) => setCustomerId(event.target.value)}><option value="">Scegli un cliente</option>{customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.name} · {customer.phone}</option>)}</select><label>Scrivi ELIMINA per confermare<input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="ELIMINA" /></label><button type="button" onClick={eraseCustomer} disabled={!owner || confirmation !== "ELIMINA" || !customerId || Boolean(busy)}><Eraser size={16} />{busy === "erase" ? "Anonimizzazione..." : "Rendi anonimo"}</button></div>
      {!owner && <p className="privacy-permission">Solo il proprietario può eseguire questa operazione.</p>}
    </section>

    {notice && <button className="privacy-notice" type="button" onClick={() => setNotice("")}>{notice}</button>}
    <section className="privacy-history"><header><span>Registro richieste</span><h2>Operazioni recenti</h2></header>{initialData.requests.length ? <div>{initialData.requests.map((request) => <article key={request.id}><strong>{requestLabels[request.requestType] || request.requestType}</strong><span>{new Date(request.createdAt).toLocaleString("it-IT")}</span><small>{request.requestedBy}</small><b>{request.status === "completed" ? "Completata" : request.status}</b></article>)}</div> : <p>Nessuna richiesta registrata.</p>}</section>
  </main>;
}
