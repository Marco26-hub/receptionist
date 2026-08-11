"use client";

import { useState } from "react";
import { Check, Database, MessageCircle, Save, Sparkles, WalletCards } from "lucide-react";

type SettingsProps = {
  organization: {
    name: string;
    city: string | null;
    toneOfVoice: string;
    averageTicketCents: number;
    settings: Record<string, unknown>;
  };
  integrations: { database: boolean; ai: boolean; whatsapp: boolean; stripe: boolean };
  mode: "demo" | "live";
};

const days: Array<[number, string]> = [[1, "Lun"], [2, "Mar"], [3, "Mer"], [4, "Gio"], [5, "Ven"], [6, "Sab"], [0, "Dom"]];

export function AdminSettings({ organization, integrations, mode }: SettingsProps) {
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
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
