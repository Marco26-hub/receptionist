import type { Metadata } from "next";
import Image from "next/image";
import { JsonLd } from "./components/JsonLd";
import { SiteFooter } from "./components/SiteFooter";
import { SiteHeader } from "./components/SiteHeader";
import { legalEntity } from "./lib/legal";
import { cities, contactHref, siteUrl } from "./lib/site";

export const metadata: Metadata = {
  title: "Segretaria telefonica AI e agenda intelligente",
  description: "AgendaPiena AI risponde alle chiamate, fissa appuntamenti, recupera clienti e prepara messaggi WhatsApp per attività che lavorano su appuntamento.",
  alternates: { canonical: "/" },
};

const opportunities = [
  ["Orario libero domani alle 15:30", "6 clienti adatte al trattamento laser gambe", "€420", "Agenda"],
  ["Clienti assenti da 90 giorni", "18 persone con buone possibilità di ritorno", "€1.240", "Recupero"],
  ["Controllo dopo il trattamento viso", "9 messaggi personali pronti", "€630", "Continuità"],
];

const benefits = [
  ["Risponde al telefono", "Accoglie chi chiama, spiega servizi, prezzi e orari usando soltanto le informazioni approvate da te."],
  ["Fissa gli appuntamenti", "Controlla gli orari disponibili, raccoglie i dati e salva la prenotazione dopo la conferma del cliente."],
  ["Recupera i clienti", "Trova chi non torna da tempo, i percorsi interrotti e le persone adatte a un orario rimasto libero."],
  ["Prepara i messaggi", "Scrive messaggi WhatsApp personali. Tu li controlli e decidi quali inviare."],
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
    legalName: legalEntity.name,
    url: siteUrl,
    email: legalEntity.email,
    telephone: legalEntity.phone,
    taxID: legalEntity.vatNumber,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Via Giuseppe Verdi 2B",
      postalCode: "22072",
      addressLocality: "Cermenate",
      addressRegion: "CO",
      addressCountry: "IT",
    },
    areaServed: "IT",
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "AgendaPiena AI",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: "Segretaria telefonica AI e agenda intelligente che risponde alle chiamate, fissa appuntamenti, recupera clienti e prepara messaggi WhatsApp da approvare.",
    offers: { "@type": "Offer", price: "390", priceCurrency: "EUR", url: `${siteUrl}/prezzi` },
  },
];

export default function Home() {
  return (
    <main>
      <JsonLd data={schemas} />
      <div className="home-hero">
        <div className="cinematic-media" aria-hidden="true">
          <Image
            src="/agendapiena-receptionist-hero-v1.webp"
            alt=""
            fill
            priority
            fetchPriority="high"
            sizes="100vw"
            unoptimized
          />
          <div className="cinematic-vignette" />
          <div className="cinematic-light" />
          <div className="film-grain" />
          <div className="tech-orbit orbit-one" />
          <div className="tech-orbit orbit-two" />
        </div>
        <SiteHeader />
        <section className="hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Segretaria telefonica e agenda intelligente</span>
            <h1>Risponde al telefono. Fissa appuntamenti. Riempie l’agenda.</h1>
            <p>
              AgendaPiena AI è un’assistente virtuale per attività su appuntamento. Risponde alle chiamate, informa i clienti, prenota negli orari disponibili e prepara i messaggi WhatsApp per recuperare chi non torna da tempo.
            </p>
            <div className="hero-actions">
              <a className="primary-action" href={contactHref}>Prenota una demo</a>
              <a className="secondary-action" href="/come-funziona">Guarda cosa fa</a>
            </div>
            <div className="proof-strip" aria-label="Caratteristiche principali">
              <span>Italiano e inglese</span>
              <span>Tu scegli le regole</span>
              <span>Attivo anche quando sei occupato</span>
            </div>
          </div>

          <div className="hero-stage luxury-stage" aria-label="Anteprima dell’intelligenza operativa AgendaPiena">
            <span className="live-caption"><i /> Conversazione assistita</span>
            <div className="phone-frame floating-console">
              <div className="phone-top"><span>Oggi</span><strong>€2.290 individuati</strong></div>
              <div className="pulse-card"><span className="live-dot" />Assistente attivo</div>
              {opportunities.slice(0, 2).map(([title, detail, value, tag]) => (
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

      <section className="service-clarity section">
        <div className="section-title"><span>In parole semplici</span><h2>Due servizi, anche nello stesso piano.</h2><p>Puoi usare soltanto la segretaria telefonica, soltanto il sistema per recuperare clienti, oppure collegarli per gestire tutto da un unico pannello.</p></div>
        <div className="service-clarity-grid">
          <article><span>01</span><h3>Segretaria telefonica AI</h3><p>Risponde al numero dell’attività, parla con il cliente, comunica le informazioni corrette e fissa, sposta o annulla appuntamenti.</p><a href="/assistente-vocale-ai">Scopri il servizio voce →</a></article>
          <article><span>02</span><h3>Agenda, clienti e WhatsApp</h3><p>Controlla agenda e storico clienti, segnala chi ricontattare e prepara messaggi personali da approvare prima dell’invio.</p><a href="/prodotto">Scopri agenda e clienti →</a></article>
          <article><span>03</span><h3>Tutto in uno</h3><p>Telefonate, prenotazioni, recupero clienti e messaggi lavorano insieme. Tu e il personale vedete tutto nello stesso posto.</p><a href="/prezzi">Confronta i piani →</a></article>
        </div>
      </section>

      <section className="statement-band">
        <p>Quando non puoi rispondere, risponde lei.</p>
        <h2>Il cliente riceve aiuto subito. Tu ritrovi la richiesta e l’appuntamento nel pannello.</h2>
      </section>

      <section className="section">
        <div className="section-title">
          <span>Cosa fa davvero</span>
          <h2>Gestisce le richieste ripetitive, senza toglierti il controllo.</h2>
          <p>L’assistente usa servizi, prezzi, orari e regole inseriti dalla tua attività. Le richieste delicate o non previste vengono passate a una persona.</p>
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

      <section className="full-workflow">
        <div className="section-title"><span>Il flusso completo</span><h2>Da una richiesta a un appuntamento confermato.</h2></div>
        <div className="workflow-rail">
          {["Riceve la richiesta", "Capisce cosa serve", "Controlla l’agenda", "Prenota o prepara il messaggio", "Registra il risultato"].map((label, index) => <div key={label}><span>{String(index + 1).padStart(2, "0")}</span><strong>{label}</strong></div>)}
        </div>
        <p>Ogni passaggio resta visibile. Puoi controllare cosa ha chiesto il cliente, quale risposta ha ricevuto e se l’appuntamento è stato fissato.</p>
        <a className="text-link" href="/come-funziona">Vedi ogni fase nel dettaglio <span>→</span></a>
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
        <div className="section-title"><span>Per chi lavora su appuntamento</span><h2>Utile ogni volta che una chiamata persa può diventare lavoro perso.</h2></div>
        <div className="audience-grid">
          <a href="/settori/centri-estetici"><span>01</span><h3>Centri estetici</h3><p>Richiami, pacchetti, laser, viso e corpo.</p></a>
          <a href="/settori/cliniche-estetiche"><span>02</span><h3>Cliniche estetiche e longevità</h3><p>Follow-up, controlli e continuità dei percorsi.</p></a>
          <a href="/settori/parrucchieri"><span>03</span><h3>Parrucchieri e barberie</h3><p>Telefonate, appuntamenti, colore e richiami personali.</p></a>
          <a href="/settori/studi-dentistici"><span>04</span><h3>Studi dentistici</h3><p>Prenotazioni, spostamenti e richiami organizzativi.</p></a>
          <a href="/settori/fisioterapia"><span>05</span><h3>Fisioterapia e osteopatia</h3><p>Sedute, cicli da completare e richieste da passare allo studio.</p></a>
          <a href="/settori"><span>06</span><h3>Altre attività</h3><p>Officine, studi professionali, ristorazione e servizi locali.</p></a>
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
