"use client";

import { ArrowLeft, LoaderCircle, ShieldCheck, UserPlus, UsersRound } from "lucide-react";
import { useState } from "react";

type Member = { id: string; email: string; name: string; role: "owner" | "manager" | "staff"; active: boolean; createdAt: Date };
const roleName = { owner: "Proprietario", manager: "Responsabile", staff: "Collaboratore" };

export function TeamAdmin({ initialMembers, canManage }: { initialMembers: Member[]; canManage: boolean }) {
  const [members, setMembers] = useState(initialMembers); const [busy, setBusy] = useState(""); const [notice, setNotice] = useState("");
  async function invite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy("invite"); setNotice(""); const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/team", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(form)) });
    const result = await response.json(); setBusy("");
    if (!response.ok) { setNotice(result.error || "Invito non riuscito"); return; }
    setMembers((current) => [result.member, ...current.filter((member) => member.id !== result.member.id)]); event.currentTarget.reset(); setNotice("Invito inviato. La persona potrà impostare la propria password.");
  }
  async function toggle(member: Member) {
    setBusy(member.id); setNotice("");
    const response = await fetch("/api/admin/team", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: member.id, active: !member.active, role: member.role === "owner" ? undefined : member.role }) });
    const result = await response.json(); setBusy("");
    if (!response.ok) { setNotice(result.error || "Modifica non riuscita"); return; }
    setMembers((current) => current.map((item) => item.id === member.id ? result.member : item)); setNotice(result.member.active ? "Utente riattivato." : "Accesso disattivato.");
  }
  return <main className="team-page"><a href="/admin"><ArrowLeft size={17} /> Torna alla giornata</a><header><div><span>Accessi e responsabilità</span><h1>Il tuo team</h1><p>Ogni persona usa il proprio accesso. Non condividere la password del proprietario.</p></div><UsersRound size={34} /></header>
    {canManage && <form onSubmit={invite}><label>Nome<input name="name" required maxLength={120} /></label><label>Email<input name="email" type="email" required /></label><label>Ruolo<select name="role" defaultValue="staff"><option value="staff">Collaboratore</option><option value="manager">Responsabile</option></select></label><button disabled={Boolean(busy)}>{busy === "invite" ? <LoaderCircle className="spin" size={17} /> : <UserPlus size={17} />} Invita</button></form>}
    {notice && <button className="team-notice" onClick={() => setNotice("")}>{notice}</button>}
    <section><div className="team-head"><span>Persona</span><span>Ruolo</span><span>Stato</span><span /></div>{members.map((member) => <div className="team-row" key={member.id}><div><strong>{member.name}</strong><small>{member.email}</small></div><span><ShieldCheck size={15} /> {roleName[member.role]}</span><em className={member.active ? "active" : ""}>{member.active ? "Attivo" : "Disattivato"}</em>{canManage && member.role !== "owner" ? <button disabled={Boolean(busy)} onClick={() => toggle(member)}>{busy === member.id ? "Attendi" : member.active ? "Disattiva" : "Riattiva"}</button> : <span />}</div>)}</section>
  </main>;
}
