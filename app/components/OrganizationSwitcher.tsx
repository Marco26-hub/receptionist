"use client";

import { ArrowLeft, Building2, Check, LoaderCircle, ShieldCheck } from "lucide-react";
import { useState } from "react";

type OrganizationAccess = { organizationId: string; organizationName: string; city: string | null; memberId: string; role: "owner" | "manager" | "staff" };
const roleLabel = { owner: "Proprietario", manager: "Responsabile", staff: "Collaboratore" };

export function OrganizationSwitcher({ organizations, currentOrganizationId, platformAdmin }: { organizations: OrganizationAccess[]; currentOrganizationId: string; platformAdmin: boolean }) {
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  async function choose(organizationId: string) {
    setBusy(organizationId); setNotice("");
    const response = await fetch("/api/admin/organizations/switch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ organizationId }) });
    const result = await response.json();
    if (!response.ok) { setBusy(""); setNotice(result.error || "Cambio attività non riuscito"); return; }
    window.location.assign("/admin");
  }
  return <main className="organization-switcher-page">
    <a href="/admin"><ArrowLeft size={17} /> Torna alla giornata</a>
    <header><div><span>Accessi separati</span><h1>Le tue attività</h1><p>Scegli l’azienda su cui lavorare. Dati, agenda, messaggi e assistente restano separati.</p></div><Building2 size={34} /></header>
    {platformAdmin && <a className="platform-admin-link" href="/piattaforma"><ShieldCheck size={18} /><span><strong>Gestione AgendaPiena</strong><small>Crea aziende e controlla lo stato dei clienti</small></span></a>}
    {notice && <p className="organization-notice">{notice}</p>}
    <section className="organization-access-list">
      {organizations.map((organization) => {
        const current = organization.organizationId === currentOrganizationId;
        return <article key={organization.organizationId} className={current ? "current" : ""}>
          <Building2 size={21} /><div><strong>{organization.organizationName}</strong><small>{organization.city || "Città non indicata"} · {roleLabel[organization.role]}</small></div>
          <button disabled={current || Boolean(busy)} onClick={() => choose(organization.organizationId)}>{current ? <><Check size={16} /> In uso</> : busy === organization.organizationId ? <><LoaderCircle className="spin" size={16} /> Attendi</> : "Apri"}</button>
        </article>;
      })}
    </section>
  </main>;
}
