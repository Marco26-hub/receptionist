import type { Metadata } from "next";
import {
  ArrowRight,
  CalendarCheck,
  Check,
  Clock3,
  Headphones,
  PhoneCall,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { JsonLd } from "../components/JsonLd";
import { LeadForm } from "../components/LeadForm";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { siteUrl } from "../lib/site";

export const metadata: Metadata = {
  title: "Assistente vocale AI che risponde al telefono",
  description:
    "Assistente vocale AI in italiano e inglese per PMI: risponde alle chiamate, fissa appuntamenti e passa la telefonata allo staff quando serve.",
  alternates: { canonical: "/assistente-vocale-ai" },
  openGraph: {
    title: "AgendaPiena Voice | L’assistente AI che risponde al telefono",
    description:
      "Non perdere più una chiamata: risposte naturali, appuntamenti in agenda e passaggio immediato allo staff.",
    url: "/assistente-vocale-ai",
    images: [
      {
        url: "/agendapiena-luxury-receptionist.png",
        width: 1536,
        height: 2304,
        alt: "Assistente vocale AgendaPiena al telefono",
      },
    ],
  },
};

const workflow = [
  ["Risponde", "Accoglie la persona con il nome della tua attività e comprende il motivo della chiamata."],
  ["Capisce", "Risponde alle domande usando soltanto servizi, prezzi, orari e regole che hai approvato."],
  ["Prenota", "Controlla le disponibilità e inserisce l’appuntamento senza creare sovrapposizioni."],
  ["Conferma", "Invia il riepilogo e registra richiesta, esito e prossima azione nella stessa area di lavoro."],
];

const capabilities = [
  { icon: Clock3, title: "Risponde anche quando sei occupato", copy: "Durante un trattamento, fuori orario o mentre il team segue altri clienti." },
  { icon: CalendarCheck, title: "Fissa e modifica appuntamenti", copy: "Propone orari disponibili, raccoglie i dati e aggiorna l’agenda collegata." },
  { icon: Sparkles, title: "Conosce davvero la tua attività", copy: "Servizi, durata, prezzi, preparazione, politiche di cancellazione e domande frequenti." },
  { icon: Headphones, title: "Passa la chiamata a una persona", copy: "Se la richiesta è delicata, urgente o non prevista, coinvolge subito il tuo staff." },
];

const sectors = [
  "Centri estetici e parrucchieri",
  "Cliniche e studi dentistici",
  "Officine, gommisti e carrozzerie",
  "Panetterie, pasticcerie e gastronomie",
  "Ristoranti, bar e locali",
  "Idraulici, elettricisti e fabbri",
  "Veterinari e servizi per animali",
  "Palestre e centri sportivi",
  "Hotel, B&B e strutture ricettive",
  "Agenzie immobiliari",
  "Studi professionali",
  "Negozi e assistenza prodotti",
];

const voicePlans = [
  {
    name: "Voce Base",
    price: "€199",
    note: "al mese",
    setup: "Avvio €590 una tantum",
    items: [
      "300 minuti: circa 100 conversazioni da 3 minuti.",
      "Una lingua: scegli italiano oppure inglese.",
      "Agenda: propone gli orari e prenota dopo la conferma.",
      "Prove scaricabili: controlli le risposte prima dell’attivazione.",
      "Oltre soglia: €0,40 per ogni minuto aggiuntivo.",
    ],
  },
  {
    name: "Voce Attività",
    price: "€349",
    note: "al mese",
    setup: "Avvio €790 una tantum",
    featured: true,
    items: [
      "700 minuti: circa 230 conversazioni da 3 minuti.",
      "Lingua automatica: riconosce italiano o inglese.",
      "Passaggio al personale: inoltra le richieste che lo richiedono.",
      "Registro chiamate: salva trascrizione, riepilogo e risultato.",
      "Oltre soglia: €0,35 per ogni minuto aggiuntivo.",
    ],
  },
  {
    name: "Voce Azienda",
    price: "€649",
    note: "al mese",
    setup: "Avvio da €990 una tantum",
    items: [
      "1.500 minuti: circa 500 conversazioni da 3 minuti.",
      "Percorsi per reparto: applica regole diverse in base alla richiesta.",
      "Collegamenti: verifichiamo il gestionale prima del contratto.",
      "Controllo qualità: evidenzia le conversazioni da rivedere.",
      "Oltre soglia: €0,30 per ogni minuto aggiuntivo.",
    ],
  },
];

export default function VoiceAssistantPage() {
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "AgendaPiena Voice",
      serviceType: "Assistente vocale AI per la gestione delle chiamate e degli appuntamenti",
      provider: { "@type": "Organization", name: "AgendaPiena AI", url: siteUrl },
      areaServed: { "@type": "Country", name: "Italia" },
      url: `${siteUrl}/assistente-vocale-ai`,
      description: "Assistente vocale AI che risponde al telefono, informa sui servizi, gestisce appuntamenti e trasferisce le chiamate allo staff.",
      offers: { "@type": "AggregateOffer", lowPrice: "199", highPrice: "649", priceCurrency: "EUR", offerCount: "3" },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        ["Sembra una voce registrata?", "No. La conversazione è dinamica: l’assistente ascolta, comprende la richiesta e risponde in modo naturale in base alle informazioni approvate."],
        ["Può trasferire la chiamata?", "Sì. Quando la persona lo chiede o la richiesta richiede lo staff, la chiamata può essere trasferita a un numero concordato."],
        ["Può dare consigli medici?", "No. L’assistente gestisce informazioni organizzative e appuntamenti. Le domande cliniche vengono sempre affidate a un professionista."],
        ["Può parlare inglese?", "Sì. In modalità automatica riconosce se la persona parla italiano o inglese e risponde nella stessa lingua."],
      ].map(([name, text]) => ({ "@type": "Question", name, acceptedAnswer: { "@type": "Answer", text } })),
    },
  ];

  return (
    <main className="voice-page">
      <JsonLd data={schemas} />
      <section className="voice-hero">
        <div className="voice-hero-media" aria-hidden="true" />
        <div className="voice-hero-shade" aria-hidden="true" />
        <SiteHeader />
        <div className="voice-hero-inner">
          <div className="voice-hero-copy">
            <span className="voice-kicker"><i /> AgendaPiena Voice</span>
            <h1>Ogni chiamata trova una risposta.</h1>
            <p>Un assistente vocale risponde con naturalezza, spiega i tuoi servizi e fissa appuntamenti. Quando serve una persona, passa la chiamata al tuo staff.</p>
            <div className="hero-actions">
              <a className="voice-primary" href="#demo">Richiedi una prova <ArrowRight size={17} /></a>
              <a className="voice-secondary" href="#come-funziona">Guarda come funziona</a>
            </div>
            <div className="voice-trust">
              <span><Check size={15} /> Sempre sotto il tuo controllo</span>
              <span><Check size={15} /> Riconosce italiano e inglese</span>
              <span><Check size={15} /> Attivo 24 ore su 24</span>
            </div>
          </div>

          <div className="voice-live" aria-label="Esempio di una chiamata gestita da AgendaPiena Voice">
            <div className="voice-live-top">
              <span className="voice-avatar"><PhoneCall size={20} /></span>
              <div><small>Chiamata in corso</small><strong>Nuova cliente</strong></div>
              <span className="voice-timer">01:24</span>
            </div>
            <div className="voice-wave" aria-hidden="true">
              {[18, 34, 52, 27, 64, 44, 76, 31, 58, 39, 69, 25, 48, 32, 17].map((height, index) => <i key={index} style={{ height }} />)}
            </div>
            <div className="voice-transcript">
              <p><span>Cliente</span> Avete un posto per una pulizia viso questa settimana?</p>
              <p><span>AgendaPiena</span> Certamente. Giovedì posso proporti le 16:30 oppure le 18:00. Quale preferisci?</p>
            </div>
            <div className="voice-booked"><CalendarCheck size={19} /><div><strong>Appuntamento trovato</strong><span>Giovedì · 16:30 · Pulizia viso</span></div></div>
          </div>
        </div>
        <a className="voice-scroll" href="#come-funziona" aria-label="Vai alla sezione successiva"><span /> Scopri il servizio</a>
      </section>

      <section className="voice-proof">
        <p>Non è una segreteria telefonica.</p>
        <h2>Ascolta, risponde e porta la conversazione fino al prossimo passo utile.</h2>
      </section>

      <section className="voice-section" id="come-funziona">
        <div className="voice-heading"><span>Una chiamata, dall’inizio alla fine</span><h2>Il cliente parla. L’assistente fa il resto.</h2><p>Impostiamo insieme ciò che può dire e fare. Da quel momento ogni telefonata segue un percorso semplice, verificabile e coerente con il tuo modo di lavorare.</p></div>
        <div className="voice-workflow">
          {workflow.map(([title, copy], index) => <article key={title}><span>{String(index + 1).padStart(2, "0")}</span><h3>{title}</h3><p>{copy}</p></article>)}
        </div>
      </section>

      <section className="voice-capabilities">
        <div className="voice-heading"><span>Cosa può fare</span><h2>Una presenza costante, senza complicare il lavoro.</h2></div>
        <div className="voice-feature-list">
          {capabilities.map(({ icon: Icon, title, copy }) => <article key={title}><Icon size={25} strokeWidth={1.6} /><div><h3>{title}</h3><p>{copy}</p></div></article>)}
        </div>
        <div className="voice-safety">
          <ShieldCheck size={28} />
          <div><strong>Il limite è parte del servizio.</strong><p>Niente diagnosi, promesse o risposte inventate. Sui temi sensibili l’assistente si ferma e coinvolge una persona.</p></div>
        </div>
      </section>

      <section className="voice-sectors">
        <div className="voice-heading"><span>Per chi riceve molte chiamate</span><h2>Utile ovunque un telefono occupato può diventare un appuntamento perso.</h2></div>
        <div className="voice-sector-list">{sectors.map((sector, index) => <span key={sector}><b>{String(index + 1).padStart(2, "0")}</b>{sector}</span>)}</div>
      </section>

      <section className="voice-pricing">
        <div className="voice-pricing-intro"><span>Prezzi trasparenti</span><h2>Un servizio serio, con costi leggibili.</h2><p>Il canone copre il servizio e i minuti indicati. Il costo di avvio copre raccolta delle informazioni, configurazione, collegamento dell’agenda, prove e messa online controllata.</p></div>
        <div className="voice-plan-grid">
          {voicePlans.map((plan) => <article className={`voice-price-panel${plan.featured ? " featured" : ""}`} key={plan.name}><small>{plan.featured ? "Più scelto" : "Segretaria telefonica"}</small><h3>{plan.name}</h3><strong>{plan.price}</strong><span>{plan.note}</span><p className="voice-price-setup">{plan.setup}</p><ul>{plan.items.map((item) => <li key={item}>{item}</li>)}</ul><a href="#demo">Richiedi una prova</a></article>)}
        </div>
        <p className="voice-price-note">Prezzi IVA esclusa. Numero telefonico, traffico dell’operatore, assistenti aggiuntivi e collegamenti speciali non sono inclusi: vengono indicati nella proposta prima dell’attivazione. Nessun addebito durante la prova in admin.</p>
      </section>

      <section className="voice-demo" id="demo">
        <div><span>Progetto pilota</span><h2>Facciamogli rispondere alla tua prima chiamata.</h2><p>Raccontaci che tipo di attività gestisci. Prepariamo una dimostrazione sul tuo caso, con domande e appuntamenti simili a quelli che ricevi ogni giorno.</p><div className="contact-notes"><span>01 · Nessun cambio di numero immediato</span><span>02 · Prova prima dell’attivazione</span><span>03 · Una persona interviene quando serve</span></div></div>
        <LeadForm source="voice-page" />
      </section>

      <section className="voice-faq">
        <span>Domande semplici, risposte chiare</span><h2>Prima di affidargli il telefono.</h2>
        <details><summary>Sembra una voce registrata?</summary><p>No. La conversazione cambia in base a ciò che dice la persona. L’assistente ascolta e risponde usando le informazioni che hai approvato.</p></details>
        <details><summary>Devo cambiare il mio numero?</summary><p>No. Possiamo partire con un nuovo numero per la prova e, in seguito, inoltrare le chiamate dal numero che usi già.</p></details>
        <details><summary>Può trasferire la chiamata?</summary><p>Sì. Se la persona lo chiede o la richiesta richiede lo staff, la telefonata viene passata al numero concordato.</p></details>
        <details><summary>Può dare consigli medici?</summary><p>No. Gestisce informazioni organizzative e appuntamenti. Ogni domanda clinica viene affidata a un professionista.</p></details>
        <details><summary>Riconosce automaticamente la lingua?</summary><p>Sì. In modalità automatica ascolta se la persona parla italiano o inglese e continua nella stessa lingua. Quando tutta la clientela usa una sola lingua, quella modalità offre la precisione migliore.</p></details>
      </section>
      <SiteFooter />
    </main>
  );
}
