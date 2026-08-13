"use client";
import Image from "next/image";
/* eslint-disable @next/next/no-html-link-for-pages */
import { useMemo, useState } from "react";
import {
  CalendarDays,
  CalendarCheck,
  Check,
  ChevronRight,
  CircleDollarSign,
  LogOut,
  MessageSquareText,
  PhoneCall,
  RefreshCw,
  Search,
  Settings,
  ListChecks,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react";

type Opportunity = {
  id: string;
  customerId: string | null;
  customerName: string;
  phone: string;
  type: string;
  title: string;
  reason: string;
  score: number;
  estimatedValueCents: number;
  status: string;
  message: string;
};
type DashboardProps = {
  initialData: {
    organization: { id: string; name: string; city?: string | null };
    metrics: {
      potentialValueCents: number;
      activeOpportunities: number;
      emptySlots: number;
      messagesToApprove: number;
      conversionRate: number;
    };
    opportunities: Opportunity[];
    mode: "demo" | "empty" | "live";
  };
  userEmail: string;
};

const euro = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
const typeLabel: Record<string, string> = {
  inactive_client: "Cliente da recuperare",
  empty_slot: "Spazio libero",
  unfinished_plan: "Percorso interrotto",
  follow_up: "Controllo",
};

export function AdminDashboard({ initialData, userEmail }: DashboardProps) {
  const [opportunities, setOpportunities] = useState(initialData.opportunities);
  const [selected, setSelected] = useState<Opportunity | null>(
    initialData.opportunities[0] || null,
  );
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const visible = useMemo(
    () =>
      opportunities.filter(
        (item) =>
          (filter === "all" || item.type === filter) &&
          `${item.customerName} ${item.title}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [opportunities, filter, query],
  );

  async function changeStatus(id: string, action: "approve" | "dismiss") {
    setBusy(true);
    const response = await fetch(`/api/admin/opportunities/${id}/${action}`, {
      method: "POST",
      headers: action === "approve" ? { "Content-Type": "application/json" } : undefined,
      body: action === "approve" ? JSON.stringify({ body: selected?.message }) : undefined,
    });
    const result = await response.json();
    setBusy(false);
    if (!response.ok) {
      setNotice(result.error || "Operazione non riuscita");
      return;
    }
    setOpportunities((items) => items.filter((item) => item.id !== id));
    setSelected(null);
    setNotice(action === "approve" ? result.demo ? "Flusso di invio completato in modalità demo." : "Messaggio approvato e inviato." : "Opportunità archiviata.");
  }
  async function regenerate() {
    if (!selected) return;
    setBusy(true);
    const response = await fetch("/api/admin/messages/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        opportunityId: selected.id,
      }),
    });
    const result = await response.json();
    setBusy(false);
    if (response.ok) {
      const updated = { ...selected, message: result.body };
      setSelected(updated);
      setOpportunities((items) =>
        items.map((item) => (item.id === updated.id ? updated : item)),
      );
      setNotice(
        `Nuova bozza creata con ${result.provider === "openai" ? "AI" : "modello sicuro"}.`,
      );
    } else setNotice(result.error);
  }
  async function optimizeNow() {
    setBusy(true); setNotice("");
    const response = await fetch("/api/admin/optimize", { method: "POST" });
    const result = await response.json(); setBusy(false);
    if (!response.ok) return setNotice(result.error || "Analisi non riuscita");
    setNotice(`${result.created} nuove opportunità trovate.`);
    setTimeout(() => window.location.reload(), 700);
  }
  async function markConverted() {
    if (!selected) return; setBusy(true);
    const response = await fetch(`/api/admin/opportunities/${selected.id}/convert`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    const result = await response.json(); setBusy(false);
    if (!response.ok) return setNotice(result.error || "Operazione non riuscita");
    setOpportunities((items) => items.filter((item) => item.id !== selected.id)); setSelected(null); setNotice("Prenotazione recuperata registrata.");
  }
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  const metrics = [
    {
      label: "Valore possibile",
      value: euro.format(initialData.metrics.potentialValueCents / 100),
      icon: CircleDollarSign,
    },
    {
      label: "Occasioni attive",
      value: String(initialData.metrics.activeOpportunities),
      icon: Sparkles,
    },
    {
      label: "Spazi da riempire",
      value: String(initialData.metrics.emptySlots),
      icon: CalendarDays,
    },
    {
      label: "Da approvare",
      value: String(initialData.metrics.messagesToApprove),
      icon: MessageSquareText,
    },
  ];
  return (
    <div className="admin-app">
      <aside className="admin-sidebar">
        <a className="admin-logo" href="/">
          <span><Image src="/agendapiena-mark.svg" alt="" width={38} height={38} /></span>
          <div>
            <strong>AgendaPiena</strong>
            <small>Intelligence atelier</small>
          </div>
        </a>
        <nav>
          <a className="active" href="/admin">
            <Sparkles size={18} />
            Opportunità
          </a>
          <a href="/admin/clienti">
            <UsersRound size={18} />
            Clienti
          </a>
          <a href="/admin/agenda">
            <CalendarDays size={18} />
            Agenda
          </a>
          <a href="/admin/messaggi">
            <MessageSquareText size={18} />
            Messaggi
          </a>
          <a href="/admin/voce">
            <PhoneCall size={18} />
            Voce AI
          </a>
          <a href="/admin/configurazione">
            <ListChecks size={18} />
            Configura
          </a>
          <a href="/admin/impostazioni">
            <Settings size={18} />
            Impostazioni
          </a>
        </nav>
        <div className="admin-account">
          <span>{userEmail.slice(0, 1).toUpperCase()}</span>
          <div>
            <strong>{initialData.organization.name}</strong>
            <small>{userEmail}</small>
          </div>
          <button onClick={logout} title="Esci">
            <LogOut size={17} />
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <header className="admin-top">
          <div>
            <span>
              {initialData.mode === "live"
                ? "Dati aggiornati"
                : "Modalità dimostrativa"}
            </span>
            <h1>Buongiorno. Ecco dove agire oggi.</h1>
          </div>
          <button className="optimize-button" onClick={optimizeNow} disabled={busy}>
            <RefreshCw size={17} />
            Analizza ora
          </button>
        </header>
        <section className="metric-grid">
          {metrics.map(({ label, value, icon: Icon }) => (
            <article key={label}>
              <Icon size={20} />
              <strong>{value}</strong>
              <span>{label}</span>
            </article>
          ))}
        </section>
        <section className="opportunity-workspace">
          <div className="opportunity-list">
            <div className="list-tools">
              <div className="search-box">
                <Search size={17} />
                <input
                  aria-label="Cerca opportunità"
                  placeholder="Cerca cliente o azione"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
              <select
                aria-label="Filtra opportunità"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
              >
                <option value="all">Tutte</option>
                <option value="inactive_client">Clienti da recuperare</option>
                <option value="empty_slot">Spazi liberi</option>
                <option value="follow_up">Controlli</option>
              </select>
            </div>
            <div className="list-heading">
              <strong>Priorità suggerite</strong>
              <span>{visible.length} occasioni</span>
            </div>
            {visible.map((item) => (
              <button
                className={`opportunity-line ${selected?.id === item.id ? "selected" : ""}`}
                key={item.id}
                onClick={() => setSelected(item)}
              >
                <span className="score-ring">{item.score}</span>
                <div>
                  <small>{typeLabel[item.type] || item.type}</small>
                  <strong>{item.title}</strong>
                  <p>
                    {item.customerName} · {item.reason}
                  </p>
                </div>
                <b>{euro.format(item.estimatedValueCents / 100)}</b>
                <ChevronRight size={18} />
              </button>
            ))}
          </div>
          <aside className="decision-panel">
            {selected ? (
              <>
                <div className="decision-head">
                  <span>{typeLabel[selected.type] || selected.type}</span>
                  <strong>{selected.score}/100</strong>
                </div>
                <h2>{selected.title}</h2>
                <p>
                  {selected.customerName} · {selected.reason}
                </p>
                <div className="explain-box">
                  <Sparkles size={17} />
                  <div>
                    <strong>Perché è una priorità</strong>
                    <p>
                      Il punteggio combina tempo dall’ultima visita, valore
                      storico, compatibilità e momento utile. Il consenso è
                      stato verificato prima della proposta.
                    </p>
                  </div>
                </div>
                {selected.status === "sent" ? <div className="conversion-box"><CalendarCheck size={20} /><div><strong>Messaggio inviato</strong><p>Quando il cliente prenota, registra il risultato per aggiornare il tasso di conversione.</p></div><button onClick={markConverted} disabled={busy}>Segna prenotato</button></div> : <><label className="message-editor">
                  Bozza WhatsApp
                  <textarea
                    value={selected.message}
                    onChange={(event) => {
                      const updated = {
                        ...selected,
                        message: event.target.value,
                      };
                      setSelected(updated);
                    }}
                  />
                </label>
                <button
                  className="regenerate"
                  onClick={regenerate}
                  disabled={busy}
                >
                  <Sparkles size={16} />
                  Riscrivi con AI
                </button>
                <div className="decision-actions">
                  <button
                    className="dismiss"
                    onClick={() => changeStatus(selected.id, "dismiss")}
                    disabled={busy}
                  >
                    <X size={17} />
                    Scarta
                  </button>
                  <button
                    className="approve"
                    onClick={() => changeStatus(selected.id, "approve")}
                    disabled={busy}
                  >
                    <Check size={17} />
                    Approva e invia
                  </button>
                </div>
                </>}
              </>
            ) : (
              <div className="empty-decision">
                <Check size={28} />
                <h2>Seleziona un’opportunità</h2>
                <p>Qui vedrai il motivo, la bozza e le azioni disponibili.</p>
              </div>
            )}
          </aside>
        </section>
        {notice && (
          <button className="admin-toast" onClick={() => setNotice("")}>
            {notice}
            <X size={15} />
          </button>
        )}
      </main>
    </div>
  );
}
