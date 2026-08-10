const opportunities = [
  {
    title: "Slot vuoto domani alle 15:30",
    detail: "6 clienti compatibili per laser gambe",
    value: "€420",
    tag: "Agenda",
  },
  {
    title: "Clienti ferme da 90 giorni",
    detail: "18 profili con alta probabilita di ritorno",
    value: "€1.240",
    tag: "Recupero",
  },
  {
    title: "Follow-up viso post trattamento",
    detail: "9 messaggi personalizzati pronti",
    value: "€630",
    tag: "Upsell",
  },
];

const steps = [
  "Importa clienti e agenda",
  "L'AI trova soldi nascosti",
  "Tu approvi le azioni",
  "WhatsApp riporta clienti in agenda",
];

const adminCards = [
  ["€2.290", "opportunita trovate oggi"],
  ["33", "clienti da riattivare"],
  ["4", "slot da riempire"],
  ["12", "messaggi da approvare"],
];

export default function Home() {
  return (
    <main>
      <section className="hero-shell" id="home">
        <nav className="nav">
          <a className="brand" href="#home" aria-label="AgendaPiena AI home">
            <span className="brand-mark">A</span>
            <span>AgendaPiena AI</span>
          </a>
          <div className="nav-links" aria-label="Navigazione principale">
            <a href="#workflow">Workflow</a>
            <a href="#admin">Admin</a>
            <a href="#prezzi">Prezzi</a>
          </div>
          <a className="nav-cta" href="mailto:demo@agendapiena.ai">
            Prenota demo
          </a>
        </nav>

        <div className="hero-grid">
          <div className="hero-copy">
            <div className="eyebrow">AI Growth Operator per centri beauty premium</div>
            <h1>Trova i soldi nascosti nella tua agenda.</h1>
            <p>
              Non e una segretaria AI. Ogni mattina analizza clienti, slot vuoti,
              trattamenti e storico, poi prepara azioni WhatsApp per riempire
              l&apos;agenda e recuperare clienti ferme.
            </p>
            <div className="hero-actions">
              <a className="primary-action" href="mailto:demo@agendapiena.ai">
                Voglio la demo
              </a>
              <a className="secondary-action" href="#admin">
                Vedi admin
              </a>
            </div>
            <div className="proof-strip" aria-label="Metriche chiave">
              <span>Setup in 7 giorni</span>
              <span>WhatsApp-first</span>
              <span>Mobile-first</span>
            </div>
          </div>

          <div className="hero-stage" aria-label="Anteprima prodotto">
            <div className="aurora aurora-one" />
            <div className="aurora aurora-two" />
            <div className="phone-frame">
              <div className="phone-top">
                <span>Oggi</span>
                <strong>€2.290 trovati</strong>
              </div>
              <div className="pulse-card">
                <span className="live-dot" />
                AI Operator attivo
              </div>
              {opportunities.map((item) => (
                <article className="opportunity-card" key={item.title}>
                  <div>
                    <span>{item.tag}</span>
                    <h3>{item.title}</h3>
                    <p>{item.detail}</p>
                  </div>
                  <strong>{item.value}</strong>
                </article>
              ))}
              <button className="approve-button">Approva 12 messaggi</button>
            </div>
          </div>
        </div>
      </section>

      <section className="section compact">
        <div className="section-title">
          <span>Perche vende</span>
          <h2>Gli altri rispondono. Noi facciamo crescere.</h2>
        </div>
        <div className="split">
          <div className="dark-panel">
            <h3>Problema reale</h3>
            <p>
              I centri hanno clienti acquisite a caro prezzo che non tornano,
              slot vuoti, pacchetti incompleti e messaggi WhatsApp dispersi.
            </p>
          </div>
          <div className="light-panel">
            <h3>Promessa chiara</h3>
            <p>
              Carichi agenda e lista clienti. In pochi minuti mostriamo opportunita,
              messaggi pronti e valore stimato recuperabile.
            </p>
          </div>
        </div>
      </section>

      <section className="section" id="workflow">
        <div className="section-title">
          <span>Workflow produttivo</span>
          <h2>Da dati fermi ad appuntamenti confermati.</h2>
        </div>
        <div className="workflow-grid">
          {steps.map((step, index) => (
            <article className="workflow-card" key={step}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{step}</h3>
              <p>
                {index === 0 &&
                  "CSV, Google Calendar o gestionale: partiamo anche senza integrazioni complesse."}
                {index === 1 &&
                  "Segmenta clienti inattive, follow-up, clienti VIP e slot liberi."}
                {index === 2 &&
                  "Il titolare controlla tutto da telefono e approva con un tap."}
                {index === 3 &&
                  "Messaggi personali, tracciamento risposte e prenotazioni in agenda."}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-section" id="admin">
        <div className="admin-copy">
          <span>Admin mobile-first</span>
          <h2>Una cabina di regia che si usa con un pollice.</h2>
          <p>
            Niente CRM pesante. Solo cosa fare oggi, quali clienti valgono di piu
            e quali messaggi approvare per trasformare buchi in incasso.
          </p>
          <ul>
            <li>Azioni consigliate ogni mattina</li>
            <li>Stima euro per ogni campagna</li>
            <li>Handoff umano quando serve</li>
            <li>Report settimanale per vendere il ROI</li>
          </ul>
        </div>
        <div className="admin-phone">
          <div className="admin-head">
            <span>AgendaPiena</span>
            <button>Live</button>
          </div>
          <div className="admin-kpis">
            {adminCards.map(([value, label]) => (
              <div key={label}>
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
          <div className="task-list">
            <article>
              <span className="score">92%</span>
              <div>
                <h3>Riattiva clienti laser</h3>
                <p>18 messaggi pronti, valore stimato €1.240</p>
              </div>
              <button>Approva</button>
            </article>
            <article>
              <span className="score">84%</span>
              <div>
                <h3>Riempi slot venerdi</h3>
                <p>6 clienti compatibili, valore stimato €420</p>
              </div>
              <button>Approva</button>
            </article>
            <article>
              <span className="score">76%</span>
              <div>
                <h3>Follow-up trattamento viso</h3>
                <p>9 clienti da contattare entro oggi</p>
              </div>
              <button>Approva</button>
            </article>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-title">
          <span>Messaggi smart friendly</span>
          <h2>WhatsApp personale, non newsletter.</h2>
        </div>
        <div className="message-grid">
          <div className="chat-bubble incoming">Ciao, volevo riprendere il laser ma non so quando.</div>
          <div className="chat-bubble outgoing">
            Ciao Martina, si e liberato uno slot domani alle 15:30. E perfetto
            per continuare il percorso gambe. Vuoi che te lo blocchi?
          </div>
          <div className="chat-bubble incoming">Si, bloccalo pure.</div>
          <div className="chat-bubble outgoing">
            Fatto. Ti mando promemoria domani mattina. Se vuoi spostare, scrivimi qui.
          </div>
        </div>
      </section>

      <section className="pricing" id="prezzi">
        <div>
          <span>Go-live offer</span>
          <h2>Vendibile da subito, premium per scelta.</h2>
          <p>
            Non competiamo con tool da 19 euro. Vendiamo recupero fatturato e
            operativita quotidiana.
          </p>
        </div>
        <article className="price-card">
          <span>Pilot 30 giorni</span>
          <strong>€790 setup + €390/mese</strong>
          <p>
            Import clienti, dashboard mobile, 3 campagne AI, messaggi WhatsApp
            pronti da approvare, report ROI.
          </p>
          <a href="mailto:demo@agendapiena.ai">Blocca pilot</a>
        </article>
      </section>

      <footer>
        <strong>AgendaPiena AI</strong>
        <span>AI Growth Operator per centri beauty premium.</span>
        <a href="mailto:demo@agendapiena.ai">demo@agendapiena.ai</a>
      </footer>
    </main>
  );
}
