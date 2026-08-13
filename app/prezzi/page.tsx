import type { Metadata } from "next";
import { JsonLd } from "../components/JsonLd";
import { PageIntro } from "../components/PageIntro";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { siteUrl } from "../lib/site";
import { stripePlans } from "../lib/stripe";

export const metadata: Metadata = {
  title: "Prezzi AgendaPiena AI e Segretaria Telefonica",
  description: "Prezzi chiari per recupero clienti, messaggi WhatsApp e segretaria telefonica AI: avvio, minuti, funzioni incluse e costi aggiuntivi.",
  alternates: { canonical: "/prezzi" },
};

type Plan = {
  name: string;
  audience: string;
  price: string;
  period: string;
  setup: string;
  items: Array<{ title: string; detail: string }>;
  note: string;
  featured?: boolean;
};

const customerPlans: Plan[] = [
  {
    name: "Agenda e clienti",
    audience: "Per recuperare clienti e riempire gli spazi liberi",
    price: `€${stripePlans.agenda_clienti.monthlyAmountCents / 100}`,
    period: "al mese",
    setup: "Avvio €790 una tantum",
    items: [
      { title: "Controllo giornaliero", detail: "legge clienti, appuntamenti e spazi liberi presenti nel sistema." },
      { title: "Elenco delle priorità", detail: "mostra chi ricontattare e spiega il motivo della proposta." },
      { title: "Messaggi WhatsApp", detail: "prepara il testo; una persona deve approvarlo prima dell’invio." },
      { title: `${stripePlans.agenda_clienti.whatsappMessages.toLocaleString("it-IT")} invii inclusi`, detail: "conta ogni messaggio approvato e inviato dal pannello; i costi applicati da Meta restano separati." },
      { title: "Pannello da telefono", detail: "titolare e personale vedono attività, messaggi e risultati." },
      { title: "Riepilogo dei risultati", detail: "registra risposte, appuntamenti ottenuti e valore indicato." },
      { title: "Controllo mensile", detail: "rivediamo regole e messaggi sulla base dei risultati raccolti." },
    ],
    note: `Invii oltre soglia: €${(stripePlans.agenda_clienti.whatsappOverageCents / 100).toFixed(2).replace(".", ",")} ciascuno, oltre agli eventuali costi Meta. Esclusi gestionale esterno e pubblicità.`,
  },
  {
    name: "Tutto in uno",
    audience: "Agenda e clienti + segretaria telefonica",
    price: `€${stripePlans.tutto_in_uno.monthlyAmountCents / 100}`,
    period: "al mese",
    setup: "Avvio da €1.190 una tantum",
    items: [
      { title: "Servizio Agenda e clienti", detail: "comprende tutte le funzioni del piano da €390." },
      { title: `${stripePlans.tutto_in_uno.voiceMinutes} minuti di chiamate`, detail: "circa 100 conversazioni da 3 minuti in un mese." },
      { title: `${stripePlans.tutto_in_uno.whatsappMessages.toLocaleString("it-IT")} invii WhatsApp`, detail: "messaggi approvati e inviati dal pannello; gli eventuali costi Meta restano separati." },
      { title: "Risposta telefonica", detail: "comunica soltanto servizi, prezzi, orari e regole approvati." },
      { title: "Prenotazioni", detail: "controlla gli orari liberi e chiede conferma prima di salvare." },
      { title: "Passaggio a una persona", detail: "trasferisce la chiamata al numero indicato quando serve." },
      { title: "Un solo pannello", detail: "riunisce agenda, messaggi WhatsApp e registro chiamate." },
    ],
    note: `Oltre soglia: €${(stripePlans.tutto_in_uno.voiceOverageCents / 100).toFixed(2).replace(".", ",")}/min e €${(stripePlans.tutto_in_uno.whatsappOverageCents / 100).toFixed(2).replace(".", ",")}/invio. Costi Meta, numero e operatore indicati separatamente.`,
    featured: true,
  },
];

const voicePlans: Plan[] = [
  {
    name: "Voce Base",
    audience: "Per professionisti e piccole attività",
    price: `€${stripePlans.voce_base.monthlyAmountCents / 100}`,
    period: "al mese",
    setup: "Avvio €590 una tantum",
    items: [
      { title: `${stripePlans.voce_base.voiceMinutes} minuti al mese`, detail: "circa 100 conversazioni da 3 minuti; conta la durata, non il numero di chiamate." },
      { title: "1 segretaria e 1 numero", detail: "configuriamo un assistente e colleghiamo un solo numero telefonico." },
      { title: "Risposte approvate", detail: "usa i servizi, prezzi, orari e domande inseriti nel pannello." },
      { title: "Agenda", detail: "propone orari liberi e crea l’appuntamento solo dopo conferma." },
      { title: "Passaggio della chiamata", detail: "inoltra al personale le richieste delicate o non previste." },
      { title: "Una lingua", detail: "scegli italiano oppure inglese per la precisione migliore." },
    ],
    note: `Minuti oltre soglia: €${(stripePlans.voce_base.voiceOverageCents / 100).toFixed(2).replace(".", ",")}. Numero e traffico telefonico non inclusi salvo diversa indicazione.`,
  },
  {
    name: "Voce Attività",
    audience: "Per studi, saloni, officine e gruppi di lavoro",
    price: `€${stripePlans.voce_attivita.monthlyAmountCents / 100}`,
    period: "al mese",
    setup: "Avvio €790 una tantum",
    items: [
      { title: `${stripePlans.voce_attivita.voiceMinutes} minuti al mese`, detail: "circa 230 conversazioni da 3 minuti; conta la durata registrata." },
      { title: "Lingua automatica", detail: "riconosce italiano o inglese e risponde nella lingua di chi chiama." },
      { title: "Agenda protetta", detail: "ricontrolla la disponibilità per evitare appuntamenti sovrapposti." },
      { title: "Registro delle chiamate", detail: "salva trascrizione, riepilogo e risultato per il personale autorizzato." },
      { title: "Prove scaricabili", detail: "permette di verificare le risposte prima di attivare il numero." },
      { title: "Controllo mensile", detail: "rivediamo risposte e regole usando le conversazioni registrate." },
    ],
    note: `Minuti oltre soglia: €${(stripePlans.voce_attivita.voiceOverageCents / 100).toFixed(2).replace(".", ",")}. Audio disattivato di base e attivabile solo con regole privacy adeguate.`,
    featured: true,
  },
  {
    name: "Voce Azienda",
    audience: "Per cliniche, reparti e volumi più alti",
    price: `€${stripePlans.voce_azienda.monthlyAmountCents / 100}`,
    period: "al mese",
    setup: "Avvio da €990 una tantum",
    items: [
      { title: `${stripePlans.voce_azienda.voiceMinutes.toLocaleString("it-IT")} minuti al mese`, detail: "circa 500 conversazioni da 3 minuti; conta la durata registrata." },
      { title: "Percorsi per reparto", detail: "la stessa segretaria applica regole diverse in base alla richiesta." },
      { title: "1 segretaria e 1 numero", detail: "numeri o assistenti aggiuntivi richiedono una proposta separata." },
      { title: "Controllo qualità", detail: "ordina esiti e conversazioni da rivedere per correggere le risposte." },
      { title: "Collegamenti su misura", detail: "valutiamo il gestionale prima del contratto; lo sviluppo non è incluso automaticamente." },
      { title: "Assistenza prioritaria", detail: "tempi e canale di assistenza vengono scritti nella proposta." },
    ],
    note: `Minuti oltre soglia: €${(stripePlans.voce_azienda.voiceOverageCents / 100).toFixed(2).replace(".", ",")}. Sedi, numeri, assistenti e sviluppi aggiuntivi sono quotati separatamente.`,
  },
];

function PlanCard({ plan }: { plan: Plan }) {
  return <article className={plan.featured ? "pricing-plan featured" : "pricing-plan"}>
    <span>{plan.audience}</span>
    <h3>{plan.name}</h3>
    <div className="pricing-amount"><strong>{plan.price}</strong><small>{plan.period}</small></div>
    <p className="pricing-setup">{plan.setup}</p>
    <ul>{plan.items.map((item) => <li key={item.title}><strong>{item.title}:</strong> {item.detail}</li>)}</ul>
    <p className="pricing-note">{plan.note}</p>
    <a href="/contatti">Richiedi una demo</a>
  </article>;
}

export default function PricingPage() {
  const allPlans = [...customerPlans, ...voicePlans];
  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: allPlans.map((plan, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: { "@type": "Product", name: plan.name, description: plan.audience, offers: { "@type": "Offer", price: plan.price.replace(/[^0-9]/g, ""), priceCurrency: "EUR", url: `${siteUrl}/prezzi` } },
    })),
  };

  return <main>
    <JsonLd data={schema} />
    <SiteHeader />
    <PageIntro eyebrow="Listino AgendaPiena AI" title="WhatsApp o telefono: scegli cosa vuoi automatizzare." description="Agenda e clienti prepara i messaggi e aiuta a riempire gli spazi liberi. La segretaria telefonica risponde e gestisce le prenotazioni. Puoi usarli separatamente oppure insieme." />
    <nav className="pricing-jump" aria-label="Tipi di servizio"><a href="#clienti">Agenda, clienti e WhatsApp</a><a href="#voce">Segretaria telefonica AI</a></nav>

    <section className="pricing-product" id="clienti">
      <header><span>Agenda e clienti</span><h2>Recupero clienti e messaggi WhatsApp</h2><p>Il sistema analizza i dati dell’attività, segnala chi contattare e prepara ogni messaggio. Il titolare decide sempre cosa inviare.</p></header>
      <div className="pricing-plan-grid growth">{customerPlans.map((plan) => <PlanCard plan={plan} key={plan.name} />)}</div>
    </section>

    <section className="pricing-product voice" id="voce">
      <header><span>Chiamate</span><h2>Segretaria telefonica AI</h2><p>Risponde al telefono, informa sui servizi, controlla l’agenda, fissa appuntamenti e coinvolge il personale quando serve.</p></header>
      <div className="pricing-plan-grid voice">{voicePlans.map((plan) => <PlanCard plan={plan} key={plan.name} />)}</div>
    </section>

    <section className="pricing-clarity"><strong>Prezzi IVA esclusa.</strong><p>Prima del contratto ricevi una proposta con prezzo mensile, avvio, minuti, eventuali costi telefonici e collegamenti richiesti. Nessuna funzione viene attivata senza approvazione.</p></section>
    <section className="faq-section"><span>Prima di decidere</span><h2>Domande sui prezzi</h2><details><summary>Come vengono contati i minuti?</summary><p>Conta la durata registrata delle conversazioni gestite dall’assistente. Nel contratto indichiamo anche arrotondamenti, chiamate brevissime e data di azzeramento mensile.</p></details><details><summary>Quale piano scelgo se non conosco i minuti?</summary><p>Durante la demo stimiamo le chiamate mensili partendo dai dati del numero attuale. Puoi iniziare dal piano più piccolo e salire senza ricreare l’assistente.</p></details><details><summary>Posso aumentare o ridurre il piano?</summary><p>Sì. L’aumento viene attivato appena lo confermi; la differenza del mese in corso viene indicata prima. La riduzione parte dal rinnovo successivo, senza penali. I minuti non usati non si accumulano e non vengono rimborsati. Il costo di avvio non si ripete, salvo nuovi numeri, assistenti o collegamenti richiesti.</p></details><details><summary>Cosa comprende il costo di avvio?</summary><p>Raccolta delle informazioni, configurazione di servizi e regole, collegamento dell’agenda, prove, correzioni e messa online controllata. Collegamenti speciali con gestionali esterni vengono quotati prima.</p></details><details><summary>Il sistema telefona o scrive senza controllo?</summary><p>No. I messaggi WhatsApp richiedono approvazione. La segretaria telefonica esegue soltanto le azioni autorizzate e chiede conferma prima di prenotare.</p></details></section>
    <SiteFooter />
  </main>;
}
