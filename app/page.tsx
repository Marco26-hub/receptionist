import type { Metadata } from "next";
import { JsonLd } from "./components/JsonLd";
import { SiteFooter } from "./components/SiteFooter";
import { SiteHeader } from "./components/SiteHeader";
import { cities, contactHref, siteUrl } from "./lib/site";

export const metadata: Metadata = {
  title: "Assistente AI per centri estetici",
  description: "Trova clienti che non tornano, riempi gli orari liberi e prepara messaggi WhatsApp personali. Scopri AgendaPiena AI per centri estetici.",
  alternates: { canonical: "/" },
};

const opportunities = [
  ["Orario libero domani alle 15:30", "6 clienti adatte al trattamento laser gambe", "€420", "Agenda"],
  ["Clienti assenti da 90 giorni", "18 persone con buone possibilità di ritorno", "€1.240", "Recupero"],
  ["Controllo dopo il trattamento viso", "9 messaggi personali pronti", "€630", "Continuità"],
];

const benefits = [
  ["Recupera clienti", "Individua chi non prenota da tempo e suggerisce il momento giusto per ricontattarla."],
  ["Riempie gli spazi liberi", "Abbina ogni orario disponibile alle clienti più adatte, senza inviare messaggi a caso."],
  ["Scrive con il tuo tono", "Prepara messaggi WhatsApp naturali. Tu li controlli e decidi quali inviare."],
  ["Mostra il valore", "Ti fa vedere quali azioni possono generare appuntamenti e quanto possono valere."],
];

const steps = [
  ["Colleghiamo i dati", "Importiamo clienti e agenda dal file o dal gestionale che usi già."],
  ["L’assistente trova le occasioni", "Controlla assenze, percorsi interrotti, richiami e orari rimasti vuoti."],
  ["Tu approvi", "Ogni mattina trovi poche azioni chiare, con i messaggi già pronti."],
  ["Misuri i risultati", "Vedi risposte, appuntamenti recuperati e valore generato."],
];

const schemas = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "AgendaPiena AI",
    url: siteUrl,
    email: "demo@agendapiena.ai",
    areaServed: "IT",
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "AgendaPiena AI",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: "Assistente AI per centri estetici che recupera clienti, riempie gli orari liberi e prepara messaggi WhatsApp da approvare.",
    offers: { "@type": "Offer", price: "390", priceCurrency: "EUR", url: `${siteUrl}/prezzi` },
  },
];

export default function Home() {
  return (
    <main>
      <JsonLd data={schemas} />
      <div className="home-hero">
        <SiteHeader />
        <section className="hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Assistente AI per centri estetici</span>
            <h1>Più appuntamenti. Meno tempo perso.</h1>
            <p>
              AgendaPiena AI trova le clienti da ricontattare, gli orari da riempire e i percorsi da riprendere. Poi prepara messaggi WhatsApp personali, pronti per la tua approvazione.
            </p>
            <div className="hero-actions">
              <a className="primary-action" href={contactHref}>Prenota una demo</a>
              <a className="secondary-action" href="/come-funziona">Scopri come funziona</a>
            </div>
            <div className="proof-strip" aria-label="Caratteristiche principali">
              <span>Pensato per il beauty</span>
              <span>Controllo umano</span>
              <span>Pronto da telefono</span>
            </div>
          </div>

          <div className="hero-stage" aria-label="Anteprima della schermata AgendaPiena AI">
            <div className="signal signal-coral" />
            <div className="signal signal-mint" />
            <div className="phone-frame">
              <div className="phone-top"><span>Oggi</span><strong>€2.290 individuati</strong></div>
              <div className="pulse-card"><span className="live-dot" />Assistente attivo</div>
              {opportunities.map(([title, detail, value, tag]) => (
                <article className="opportunity-card" key={title}>
                  <div><span>{tag}</span><h3>{title}</h3><p>{detail}</p></div>
                  <strong>{value}</strong>
                </article>
              ))}
              <button className="approve-button" type="button">Controlla 12 messaggi</button>
            </div>
          </div>
        </section>
      </div>

      <section className="statement-band">
        <p>Non risponde soltanto ai messaggi.</p>
        <h2>Ti dice chi contattare, perché farlo e quale appuntamento puoi recuperare.</h2>
      </section>

      <section className="section">
        <div className="section-title">
          <span>Cosa fa ogni giorno</span>
          <h2>Il lavoro commerciale che resta sempre indietro.</h2>
          <p>AgendaPiena trasforma i dati che hai già in una lista breve di azioni utili. Niente campagne generiche e niente pannelli complicati.</p>
        </div>
        <div className="benefit-grid">
          {benefits.map(([title, copy], index) => (
            <article className="benefit-item" key={title}>
              <span>0{index + 1}</span><h3>{title}</h3><p>{copy}</p>
            </article>
          ))}
        </div>
        <a className="text-link" href="/prodotto">Vedi tutte le funzioni <span>→</span></a>
      </section>

      <section className="product-band">
        <div className="admin-copy">
          <span>Una schermata, poche decisioni</span>
          <h2>Apri. Controlla. Approva.</h2>
          <p>Dal telefono vedi le opportunità più importanti della giornata, i messaggi pronti e il valore possibile. Il tuo staff continua a lavorare come sempre.</p>
          <a className="light-action" href="/prodotto">Esplora il prodotto</a>
        </div>
        <div className="admin-phone">
          <div className="admin-head"><span>AgendaPiena</span><b>In tempo reale</b></div>
          <div className="admin-kpis">
            <div><strong>33</strong><span>clienti da ricontattare</span></div>
            <div><strong>4</strong><span>orari da riempire</span></div>
            <div><strong>12</strong><span>messaggi da controllare</span></div>
            <div><strong>€2.290</strong><span>valore possibile</span></div>
          </div>
          <div className="task-list">
            <article><span className="score">92%</span><div><h3>Riprendi il percorso laser</h3><p>18 messaggi pronti · €1.240 stimati</p></div><button>Controlla</button></article>
            <article><span className="score">84%</span><div><h3>Riempi venerdì alle 15:30</h3><p>6 clienti adatte · €420 stimati</p></div><button>Controlla</button></article>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-title"><span>Come si parte</span><h2>Operativo in quattro passaggi.</h2></div>
        <div className="workflow-grid">
          {steps.map(([title, copy], index) => <article className="workflow-card" key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{copy}</p></article>)}
        </div>
        <a className="text-link" href="/come-funziona">Guarda il percorso completo <span>→</span></a>
      </section>

      <section className="section audience-section">
        <div className="section-title"><span>Creato per chi lavora su appuntamento</span><h2>Un aiuto concreto per realtà diverse.</h2></div>
        <div className="audience-grid">
          <a href="/settori/centri-estetici"><span>01</span><h3>Centri estetici</h3><p>Richiami, pacchetti, laser, viso e corpo.</p></a>
          <a href="/settori/cliniche-estetiche"><span>02</span><h3>Cliniche estetiche e longevità</h3><p>Follow-up, controlli e continuità dei percorsi.</p></a>
        </div>
      </section>

      <section className="geo-section">
        <div className="section-title"><span>In tutta Italia</span><h2>Vicino al modo in cui lavora il tuo centro.</h2><p>Configurazione e affiancamento da remoto, con messaggi in italiano naturale e attenzione al rapporto con ogni cliente.</p></div>
        <div className="area-list">
          {cities.map((city) => <a href={`/citta/${city.slug}`} key={city.slug}>AgendaPiena AI a {city.name}</a>)}
        </div>
      </section>

      <section className="pricing-teaser">
        <div><span>Prova guidata</span><h2>Partiamo dai tuoi dati. Misuriamo risultati veri.</h2><p>Configurazione, importazione, prime azioni e affiancamento: tutto incluso per iniziare senza cambiare il tuo modo di lavorare.</p></div>
        <div><strong>€790</strong><span>configurazione iniziale</span><strong>€390/mese</strong><span>dopo l’avvio</span><a href="/prezzi">Vedi prezzi e cosa include</a></div>
      </section>
      <SiteFooter />
    </main>
  );
}
