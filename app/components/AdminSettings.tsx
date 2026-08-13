"use client";

import { useState } from "react";
import { CalendarClock, Check, Copy, Database, ExternalLink, KeyRound, MessageCircle, Save, ShieldCheck, Sparkles, Unplug, WalletCards } from "lucide-react";

type WhatsAppStatus = {
  connected: boolean;
  managedByOrganization: boolean;
  encryptionReady: boolean;
  phoneNumber: string | null;
  phoneNumberId: string | null;
  verifiedName: string | null;
  templateName: string | null;
  callbackUrl: string;
  lastVerifiedAt: string | null;
  lastSuccessAt: string | null;
  lastError: string | null;
  lastErrorCode: number | null;
};

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
    whatsapp: WhatsAppStatus;
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
  const [whatsapp, setWhatsApp] = useState(integrations.whatsapp);
  const [whatsappBusy, setWhatsAppBusy] = useState(false);
  const [whatsappNotice, setWhatsAppNotice] = useState("");
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

  async function connectWhatsApp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setWhatsAppBusy(true); setWhatsAppNotice("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/integrations/whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form)),
    });
    const result = await response.json(); setWhatsAppBusy(false);
    if (!response.ok) return setWhatsAppNotice(result.error || "Collegamento WhatsApp non riuscito");
    setWhatsApp(result.status); setWhatsAppNotice("Numero WhatsApp verificato e collegato a questa azienda.");
    event.currentTarget.reset();
  }

  async function disconnectWhatsApp() {
    if (!window.confirm("Scollegare WhatsApp? I messaggi già registrati restano visibili, ma i nuovi invii saranno bloccati.")) return;
    setWhatsAppBusy(true); setWhatsAppNotice("");
    const response = await fetch("/api/admin/integrations/whatsapp", { method: "DELETE" });
    const result = await response.json(); setWhatsAppBusy(false);
    if (!response.ok) return setWhatsAppNotice(result.error || "Operazione non riuscita");
    setWhatsApp((current) => ({ ...current, connected: false, managedByOrganization: false, phoneNumber: null, phoneNumberId: null, verifiedName: null, templateName: null, lastVerifiedAt: null, lastSuccessAt: null, lastError: null, lastErrorCode: null }));
    setWhatsAppNotice("WhatsApp scollegato. Nessun messaggio reale potrà partire.");
  }

  async function copyCallbackUrl() {
    await navigator.clipboard.writeText(whatsapp.callbackUrl);
    setWhatsAppNotice("URL webhook copiato.");
  }

  const integrationRows = [
    { key: "database", label: "Database", icon: Database, connected: integrations.database },
    { key: "ai", label: "Intelligenza AI", icon: Sparkles, connected: integrations.ai },
    { key: "whatsapp", label: "WhatsApp", icon: MessageCircle, connected: whatsapp.connected && !whatsapp.lastError },
    { key: "stripe", label: "Pagamenti", icon: WalletCards, connected: integrations.stripe },
  ] as const;

  return <main className="settings-page">
    <a href="/admin">Torna alle opportunità</a>
    <header><span>Controllo go-live</span><h1>Impostazioni operative</h1><p>Definisci come lavora il motore e verifica i collegamenti esterni.</p></header>
    <section className="integration-strip">
      {integrationRows.map(({ key, label, icon: Icon, connected }) => <article key={key} className={connected ? "connected" : ""}>
        <Icon size={19} /><strong>{label}</strong>
        {connected ? <span><Check size={13} />Collegato</span> : <span>Da collegare</span>}
      </article>)}
    </section>
    <a className="privacy-settings-link" href="/admin/privacy"><ShieldCheck size={20} /><span><strong>Dati e privacy</strong><small>Esporta i dati, scegli i tempi di conservazione e gestisci le richieste di cancellazione.</small></span><ExternalLink size={16} /></a>
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
    <section className={`calendar-settings whatsapp-settings ${whatsapp.connected && !whatsapp.lastError ? "connected" : ""}`}>
      <header>
        <div><MessageCircle size={23} /><span><strong>WhatsApp Business</strong><small>{whatsapp.connected ? `${whatsapp.verifiedName || "Account Meta verificato"}${whatsapp.phoneNumber ? ` · ${whatsapp.phoneNumber}` : ""}` : "Messaggi reali disattivati · Meta da collegare"}</small></span></div>
        <b>{whatsapp.connected && !whatsapp.lastError ? "Operativo" : whatsapp.lastError ? "Richiede controllo" : "Non collegato"}</b>
      </header>
      {whatsapp.lastError && <p className="calendar-error"><strong>Ultimo errore visibile{whatsapp.lastErrorCode ? ` (${whatsapp.lastErrorCode})` : ""}:</strong> {whatsapp.lastError}</p>}
      {!whatsapp.encryptionReady && <p className="calendar-error"><strong>Blocco di sicurezza:</strong> manca la chiave che cifra le credenziali. Aggiungi <code>INTEGRATION_ENCRYPTION_KEY</code> su Render prima di collegare Meta.</p>}
      <div className="webhook-address">
        <ShieldCheck size={18} /><span><small>URL webhook da inserire su Meta</small><strong>{whatsapp.callbackUrl}</strong></span>
        <button type="button" onClick={copyCallbackUrl} title="Copia URL webhook"><Copy size={16} /><span>Copia</span></button>
      </div>
      {whatsapp.connected ? <div className="calendar-connected-actions">
        <p>Numero ID: <strong>{whatsapp.phoneNumberId}</strong>. Template di apertura: <strong>{whatsapp.templateName}</strong>. Invii, consegne, risposte e richieste di non essere più contattati vengono registrati per questa azienda.</p>
        {whatsapp.managedByOrganization ? <button type="button" onClick={disconnectWhatsApp} disabled={whatsappBusy}><Unplug size={16} />Scollega</button> : <p className="environment-managed">Configurazione generale gestita su Render. Collegane una dedicata per rendere questa azienda indipendente.</p>}
      </div> : <form onSubmit={connectWhatsApp} className="whatsapp-connect-form">
        <div className="whatsapp-form-intro"><KeyRound size={18} /><p>Inserisci i dati della tua app Meta. Verifichiamo il numero prima di salvare e cifriamo token e segreti nel database.</p></div>
        <label>Token permanente Meta<input type="password" name="accessToken" autoComplete="off" placeholder="EAA..." required disabled={!whatsapp.encryptionReady} /></label>
        <label>ID numero WhatsApp<input name="phoneNumberId" inputMode="numeric" placeholder="123456789..." required disabled={!whatsapp.encryptionReady} /></label>
        <label>App Secret Meta<input type="password" name="appSecret" autoComplete="off" required disabled={!whatsapp.encryptionReady} /></label>
        <label>Token di verifica<input type="password" name="verifyToken" autoComplete="off" minLength={16} required disabled={!whatsapp.encryptionReady} /></label>
        <label>Nome template approvato<input name="templateName" defaultValue="agendapiena_recupero_cliente" pattern="[a-z0-9_]+" required disabled={!whatsapp.encryptionReady} /></label>
        <label>Lingua template<select name="templateLanguage" defaultValue="it" disabled={!whatsapp.encryptionReady}><option value="it">Italiano</option><option value="en">English</option><option value="en_US">English (USA)</option></select></label>
        <button disabled={whatsappBusy || !whatsapp.encryptionReady}><MessageCircle size={17} />{whatsappBusy ? "Verifica in corso..." : "Verifica e collega"}</button>
        <a href="https://business.facebook.com/wa/manage/home/" target="_blank" rel="noreferrer">Apri Meta Business <ExternalLink size={14} /></a>
      </form>}
      {whatsappNotice && <p className="calendar-notice">{whatsappNotice}</p>}
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
