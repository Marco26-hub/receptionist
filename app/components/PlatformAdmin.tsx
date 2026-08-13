"use client";

import { ArrowLeft, Building2, CalendarClock, CheckCircle2, LoaderCircle, MessageCircle, PhoneCall, Plus, UsersRound, XCircle } from "lucide-react";
import { useState } from "react";

type PlatformOrganization = {
  id: string; name: string; slug: string; city: string | null; createdAt: string; members: number; customers: number;
  subscriptionStatus: string | null; voiceStatus: string | null; calendarConnected: boolean; whatsappConnected: boolean;
};

export function PlatformAdmin({ initialOrganizations, provisioningReady }: { initialOrganizations: PlatformOrganization[]; provisioningReady: boolean }) {
  const [organizations, setOrganizations] = useState(initialOrganizations);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  async function createOrganization(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setNotice("");
    const response = await fetch("/api/platform/organizations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) });
    const result = await response.json(); setBusy(false);
    if (!response.ok) { setNotice(result.error || "Creazione non riuscita"); return; }
    const organization: PlatformOrganization = { ...result.organization, createdAt: result.organization.createdAt, members: 1, customers: 0, subscriptionStatus: null, voiceStatus: null, calendarConnected: false, whatsappConnected: false };
    setOrganizations((current) => [organization, ...current]);
    event.currentTarget.reset(); setOpen(false);
    setNotice(result.invitation === "sent" ? "Azienda creata. Il proprietario ha ricevuto l’invito." : "Azienda creata. Il proprietario aveva già un account e ora può selezionarla.");
  }
  return <main className="platform-page">
    <a href="/admin/aziende"><ArrowLeft size={17} /> Torna alle attività</a>
    <header><div><span>Solo amministratore della piattaforma</span><h1>Clienti AgendaPiena</h1><p>Crea una nuova azienda, assegna il proprietario e controlla cosa manca prima della vendita.</p></div><button onClick={() => setOpen((value) => !value)} disabled={!provisioningReady}>{open ? <XCircle size={17} /> : <Plus size={17} />}{open ? "Chiudi" : "Nuova azienda"}</button></header>
    {!provisioningReady && <p className="platform-warning"><strong>Creazione bloccata:</strong> configura Supabase URL, chiave pubblica e chiave di servizio su Render. Non creiamo clienti che poi non possono accedere.</p>}
    {notice && <button className="platform-notice" onClick={() => setNotice("")}>{notice}</button>}
    {open && provisioningReady && <form className="platform-create-form" onSubmit={createOrganization}>
      <label>Nome attività<input name="name" required maxLength={150} /></label><label>Città<input name="city" maxLength={100} /></label>
      <label>Nome proprietario<input name="ownerName" required maxLength={120} /></label><label>Email proprietario<input name="ownerEmail" type="email" required /></label>
      <button disabled={busy}>{busy ? <LoaderCircle className="spin" size={17} /> : <Building2 size={17} />}{busy ? "Creazione..." : "Crea e invita"}</button>
    </form>}
    <section className="platform-summary"><div><strong>{organizations.length}</strong><span>Aziende</span></div><div><strong>{organizations.reduce((sum, item) => sum + item.customers, 0)}</strong><span>Clienti gestiti</span></div><div><strong>{organizations.filter((item) => item.subscriptionStatus === "active" || item.subscriptionStatus === "trialing").length}</strong><span>Piani attivi</span></div></section>
    <section className="platform-organizations">
      <div className="platform-row platform-head"><span>Azienda</span><span>Utilizzo</span><span>Servizi collegati</span><span>Piano</span></div>
      {organizations.map((organization) => <article className="platform-row" key={organization.id}>
        <div><strong>{organization.name}</strong><small>{organization.city || "Città non indicata"} · dal {new Date(organization.createdAt).toLocaleDateString("it-IT")}</small></div>
        <div className="platform-usage"><span><UsersRound size={14} />{organization.members} accessi</span><span><Building2 size={14} />{organization.customers} clienti</span></div>
        <div className="platform-services"><span className={organization.voiceStatus === "live" ? "ready" : ""}><PhoneCall size={14} />Voce</span><span className={organization.calendarConnected ? "ready" : ""}><CalendarClock size={14} />Agenda</span><span className={organization.whatsappConnected ? "ready" : ""}><MessageCircle size={14} />WhatsApp</span></div>
        <span className={`platform-plan ${organization.subscriptionStatus === "active" || organization.subscriptionStatus === "trialing" ? "ready" : ""}`}>{organization.subscriptionStatus === "active" ? <CheckCircle2 size={14} /> : null}{subscriptionLabel(organization.subscriptionStatus)}</span>
      </article>)}
    </section>
  </main>;
}

function subscriptionLabel(status: string | null) {
  const labels: Record<string, string> = { active: "Attivo", trialing: "In prova", past_due: "Pagamento da controllare", canceled: "Terminato", unpaid: "Non pagato" };
  return status ? labels[status] || status : "Da attivare";
}
