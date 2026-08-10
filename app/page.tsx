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

const services = [
  "Recupero clienti inattive da 60/90/180 giorni",
  "Riempimento slot vuoti in agenda",
  "Follow-up post trattamento e pacchetti incompleti",
  "Campagne WhatsApp personalizzate da approvare",
  "Schermata mobile con incasso possibile",
  "Report settimanale semplice per titolare e staff",
];

const competitors = [
  ["Booking AI low-cost", "€19-119/mese", "Prenotazione, reminder, link agenda"],
  ["Segretaria AI generalista", "da €149/mese", "Risponde a chiamate e WhatsApp"],
  ["Gestionale beauty completo", "€24+/mese", "CRM, agenda, app e automazioni"],
  ["AgendaPiena AI", "€790 setup + €390/mese", "Clienti ferme, buchi in agenda, messaggi WhatsApp pronti"],
];

const localAreas = [
  "Milano",
  "Roma",
  "Torino",
  "Bologna",
  "Firenze",
  "Napoli",
  "Verona",
  "Rimini",
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "AgendaPiena AI",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web, Mobile, WhatsApp",
  description:
    "Assistente AI per centri estetici premium in Italia: recupera clienti ferme, riempie buchi in agenda e prepara messaggi WhatsApp da approvare.",
  offers: {
    "@type": "Offer",
    price: "390",
    priceCurrency: "EUR",
    description: "Pilot 30 giorni: setup €790 e canone €390/mese.",
  },
  areaServed: {
    "@type": "Country",
    name: "Italia",
  },
};

export default function Home() {
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="hero-shell" id="home">
        <nav className="nav">
          <a className="brand" href="#home" aria-label="AgendaPiena AI home">
            <span className="brand-mark">A</span>
            <span>AgendaPiena AI</span>
          </a>
          <div className="nav-links" aria-label="Navigazione principale">
            <a href="#workflow">Workflow</a>
            <a href="#admin">Admin</a>
            <a href="#servizi">Servizi</a>
            <a href="#prezzi">Prezzi</a>
          </div>
          <a className="nav-cta" href="mailto:demo@agendapiena.ai">
            Prenota demo
          </a>
        </nav>

        <div className="hero-grid">
          <div className="hero-copy">
            <div className="eyebrow">Assistente AI premium per centri estetici</div>
            <h1>La tua agenda lavora anche quando tu sei in cabina.</h1>
            <p>
              AgendaPiena AI controlla agenda e clienti, trova chi non torna da
              tempo, nota gli orari vuoti e prepara messaggi WhatsApp eleganti da
              approvare. Tu resti al comando, senza rincorrere chat tutto il giorno.
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
              <span>Per centri estetici premium</span>
              <span>WhatsApp-first</span>
              <span>Disegnato per titolari</span>
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
          <span>Posizionamento contro la concorrenza</span>
          <h2>Non e un bot. E una presenza ordinata dietro la tua agenda.</h2>
        </div>
        <div className="split">
          <div className="dark-panel">
            <h3>Problema reale</h3>
            <p>
              Nel beauty il problema non e solo rispondere. E non perdere il filo:
              una cliente interessata, un pacchetto lasciato a meta, un buco di
              domani pomeriggio, un messaggio arrivato mentre stai lavorando.
            </p>
          </div>
          <div className="light-panel">
            <h3>Promessa chiara</h3>
            <p>
              AgendaPiena mette ordine. Ti suggerisce chi contattare, prepara un
              messaggio curato e ti mostra quale appuntamento puo nascere da quella
              azione.
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

      <section className="section" id="servizi">
        <div className="section-title">
          <span>Servizi inclusi</span>
          <h2>Un modo piu elegante di tenere piena l'agenda.</h2>
        </div>
        <div className="service-grid">
          {services.map((service) => (
            <article className="service-card" key={service}>
              <span />
              <h3>{service}</h3>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-section" id="admin">
        <div className="admin-copy">
          <span>Admin mobile-first</span>
          <h2>Tutto quello che serve, in una schermata pulita.</h2>
          <p>
            Niente pannelli pesanti. Apri dal telefono e vedi cosa conta davvero:
            clienti da ricontattare, orari da riempire, messaggi pronti e valore
            possibile della giornata.
          </p>
          <ul>
            <li>Azioni consigliate ogni mattina</li>
            <li>Messaggi gia scritti, da approvare</li>
            <li>Passaggio allo staff quando serve</li>
            <li>Report chiaro a fine settimana</li>
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
          <span>Tono umano</span>
          <h2>Messaggi che sembrano scritti dal centro, non da una macchina.</h2>
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

      <section className="section comparison-section">
        <div className="section-title">
          <span>Prezzi e differenza</span>
          <h2>Non sostituisce il tuo stile. Lo protegge.</h2>
        </div>
        <div className="comparison-table" aria-label="Confronto concorrenza">
          {competitors.map(([name, price, focus]) => (
            <article className={name === "AgendaPiena AI" ? "comparison-row featured-row" : "comparison-row"} key={name}>
              <strong>{name}</strong>
              <span>{price}</span>
              <p>{focus}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="geo-section">
        <div className="section-title">
          <span>Disponibile in Italia</span>
          <h2>Per centri che vivono di relazione, cura e appuntamenti.</h2>
          <p>
            Ideale per centri estetici, epilazione laser, trattamenti viso,
            body shaping, saloni beauty e studi estetici avanzati in tutta Italia.
          </p>
        </div>
        <div className="area-list" aria-label="Citta servite">
          {localAreas.map((area) => (
            <span key={area}>{area}</span>
          ))}
        </div>
      </section>

      <section className="pricing" id="prezzi">
        <div>
          <span>Go-live offer</span>
          <h2>Un pilot premium, semplice da misurare.</h2>
          <p>
            Partiamo con un mese guidato: importiamo clienti e agenda, prepariamo
            le prime campagne e ti facciamo vedere se AgendaPiena porta ordine,
            appuntamenti e clienti che tornano.
          </p>
        </div>
        <article className="price-card">
          <span>Pilot 30 giorni</span>
          <strong>€790 setup + €390/mese</strong>
          <p>
            Import clienti, analisi agenda, schermata mobile, 3 campagne AI,
            messaggi WhatsApp pronti da approvare e report settimanale.
          </p>
          <a href="mailto:demo@agendapiena.ai">Blocca pilot</a>
        </article>
      </section>

      <footer>
        <strong>AgendaPiena AI</strong>
        <span>L'assistente AI che aiuta i centri estetici a riempire l'agenda.</span>
        <a href="mailto:demo@agendapiena.ai">demo@agendapiena.ai</a>
      </footer>
    </main>
  );
}
