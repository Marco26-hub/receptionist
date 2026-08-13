"use client";

import { useState } from "react";
import { CalendarClock, Check, Database, ExternalLink, KeyRound, MessageCircle, Save, Sparkles, Unplug, WalletCards } from "lucide-react";

type SettingsProps = {
  organization: {
    name: string;
    city: string | null;
    toneOfVoice: string;
    averageTicketCents: number;
    settings: Record<string, unknown>;
  };
  integrations: {
    database: boolean;
    ai: boolean;
    whatsapp: boolean;
    stripe: boolean;
    calendar: { connected: boolean; encryptionReady: boolean; eventTypeId: number | null; account: string | null; lastVerifiedAt: string | null; lastSuccessAt: string | null; lastError: string | null };
  };
  mode: "demo" | "live";
};

const days: Array<[number, string]> = [[1, "Lun"], [2, "Mar"], [3, "Mer"], [4, "Gio"], [5, "Ven"], [6, "Sab"], [0, "Dom"]];

export function AdminSettings({ organization, integrations, mode }: SettingsProps) {
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [calendar, setCalendar] = useState(integrations.calendar);
  const [calendarBusy, setCalendarBusy] = useState(false);
  const [calendarNotice, setCalendarNotice] = useState("");
  const settings = organization.settings as { openingHour?: number; closingHour?: number; slotMinutes?: number; workingDays?: number[] };

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setNotice("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...Object.fromEntries(form), averageTicketCents: Number(form.get("averageTicketEuros") || 0) * 100, workingDays: form.getAll("workingDays").map(Number) }),
    });
    const result = await response.json(); setBusy(false);
    setNotice(response.ok ? mode === "demo" ? "Impostazioni verificate in modalità demo" : "Impostazioni salvate" : result.error);
  }

  async function connectCalendar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setCalendarBusy(true); setCalendarNotice("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/integrations/calcom", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ apiKey: form.get("apiKey"), eventTypeId: Number(form.get("eventTypeId")) }) });
    const result = await response.json(); setCalendarBusy(false);
    if (!response.ok) return setCalendarNotice(result.error || "Collegamento non riuscito");
    setCalendar(result.status); setCalendarNotice("Calendario verificato e collegato. Da ora gli appuntamenti reali passano da Cal.com.");
    event.currentTarget.reset();
  }

  async function disconnectCalendar() {
    if (!window.confirm("Scollegare Cal.com? Gli appuntamenti esistenti restano salvati, ma non verranno più sincronizzati.")) return;
    setCalendarBusy(true); setCalendarNotice("");
    const response = await fetch("/api/admin/integrations/calcom", { method: "DELETE" });
    const result = await response.json(); setCalendarBusy(false);
    if (!response.ok) return setCalendarNotice(result.error || "Operazione non riuscita");
    setCalendar((current) => ({ ...current, connected: false, eventTypeId: null, account: null, lastVerifiedAt: null, lastSuccessAt: null, lastError: null }));
    setCalendarNotice("Cal.com scollegato. Il pannello segnalerà che è attiva soltanto l’agenda interna.");
  }

  const integrationRows = [
    { key: "database", label: "Database", icon: Database },
    { key: "ai", label: "OpenAI", icon: Sparkles },
    { key: "whatsapp", label: "WhatsApp", icon: MessageCircle },
    { key: "stripe", label: "Pagamenti", icon: WalletCards },
  ] as const;

  return <main className="settings-page">
    <a href="/admin">Torna alle opportunità</a>
    <header><span>Controllo go-live</span><h1>Impostazioni operative</h1><p>Definisci come lavora il motore e verifica i collegamenti esterni.</p></header>
    <section className="integration-strip">
      {integrationRows.map(({ key, label, icon: Icon }) => <article key={key} className={integrations[key] ? "connected" : ""}>
        <Icon size={19} /><strong>{label}</strong>
        {integrations[key] ? <span><Check size={13} />Collegato</span> : <span>Da collegare</span>}
      </article>)}
    </section>
    <section className={`calendar-settings ${calendar.connected ? "connected" : ""}`}>
      <header>
        <div><CalendarClock size={23} /><span><strong>Calendario appuntamenti</strong><small>{calendar.connected ? `Cal.com collegato${calendar.account ? ` · ${calendar.account}` : ""}` : "Agenda interna attiva · Cal.com da collegare"}</small></span></div>
        <b>{calendar.connected && !calendar.lastError ? "Operativo" : calendar.lastError ? "Richiede controllo" : "Non collegato"}</b>
      </header>
      {calendar.lastError && <p className="calendar-error"><strong>Ultimo errore visibile:</strong> {calendar.lastError}</p>}
      {!calendar.encryptionReady && <p className="calendar-error"><strong>Blocco di sicurezza:</strong> manca la chiave che cifra le credenziali. Nessuna chiave Cal.com può essere salvata.</p>}
      {calendar.connected ? <div className="calendar-connected-actions">
        <p>Tipo appuntamento Cal.com: <strong>#{calendar.eventTypeId}</strong>. Disponibilità, nuove prenotazioni, spostamenti e annullamenti vengono sincronizzati.</p>
        <button type="button" onClick={disconnectCalendar} disabled={calendarBusy}><Unplug size={16} />Scollega</button>
      </div> : <form onSubmit={connectCalendar} className="calendar-connect-form">
        <div><KeyRound size={18} /><p>Crea una chiave in Cal.com e indica il tipo di appuntamento da usare. La chiave viene cifrata prima di entrare nel database.</p></div>
        <label>Chiave API Cal.com<input type="password" name="apiKey" autoComplete="off" placeholder="cal_live_..." required disabled={!calendar.encryptionReady} /></label>
        <label>ID tipo appuntamento<input type="number" name="eventTypeId" min="1" step="1" placeholder="123456" required disabled={!calendar.encryptionReady} /></label>
        <button disabled={calendarBusy || !calendar.encryptionReady}><CalendarClock size={17} />{calendarBusy ? "Verifica in corso..." : "Verifica e collega"}</button>
        <a href="https://app.cal.com/settings/developer/api-keys" target="_blank" rel="noreferrer">Apri Cal.com <ExternalLink size={14} /></a>
      </form>}
      {calendarNotice && <p className="calendar-notice">{calendarNotice}</p>}
    </section>
    <form className="settings-form" onSubmit={submit}>
      <div>
        <label>Nome attività<input name="name" defaultValue={organization.name} required /></label>
        <label>Città<input name="city" defaultValue={organization.city || ""} /></label>
        <label>Valore medio appuntamento (€)<input name="averageTicketEuros" type="number" min="0" step="1" defaultValue={organization.averageTicketCents / 100} /></label>
        <label>Tono dei messaggi<textarea name="toneOfVoice" defaultValue={organization.toneOfVoice} required /></label>
      </div>
      <div>
        <label>Apertura<input name="openingHour" type="number" min="0" max="22" defaultValue={settings.openingHour ?? 9} /></label>
        <label>Chiusura<input name="closingHour" type="number" min="1" max="24" defaultValue={settings.closingHour ?? 19} /></label>
        <label>Durata spazio standard (minuti)<select name="slotMinutes" defaultValue={settings.slotMinutes ?? 60}><option value="30">30</option><option value="45">45</option><option value="60">60</option><option value="90">90</option><option value="120">120</option></select></label>
        <fieldset><legend>Giorni lavorativi</legend>{days.map(([day, label]) => <label key={day} className="day-check"><input type="checkbox" name="workingDays" value={day} defaultChecked={(settings.workingDays || [1, 2, 3, 4, 5, 6]).includes(day)} />{label}</label>)}</fieldset>
      </div>
      <button disabled={busy}><Save size={17} />{busy ? "Salvataggio..." : "Salva impostazioni"}</button>
      {notice && <p>{notice}</p>}
    </form>
  </main>;
}
