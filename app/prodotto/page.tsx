import type { Metadata } from "next";
import { PageIntro } from "../components/PageIntro";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

export const metadata: Metadata = {
  title: "Software AI per recuperare clienti e appuntamenti",
  description: "Scopri come AgendaPiena AI analizza agenda e clienti, suggerisce chi contattare e prepara messaggi WhatsApp da approvare.",
  alternates: { canonical: "/prodotto" },
};

const features = [
  ["Clienti da recuperare", "Riconosce chi non prenota da 60, 90 o 180 giorni e considera trattamenti, frequenza e storico."],
  ["Orari da riempire", "Trova gli spazi liberi e propone soltanto le clienti compatibili con durata, servizio e percorso."],
  ["Percorsi interrotti", "Segnala pacchetti incompleti, controlli mancanti e trattamenti che richiedono continuità."],
  ["Messaggi pronti", "Scrive testi personali, rispettosi e coerenti con il tono del centro. Nessun invio parte senza controllo."],
  ["Risposte ordinate", "Raccoglie l’esito delle conversazioni e aiuta lo staff a capire cosa fare dopo."],
  ["Risultati leggibili", "Mostra appuntamenti recuperati, valore generato e attività ancora da completare."],
];

export default function ProductPage() {
  return <main><SiteHeader /><PageIntro eyebrow="Il prodotto" title="Un assistente che prepara il lavoro utile." description="AgendaPiena AI legge i segnali nascosti nei dati del centro e li trasforma in azioni semplici. Ogni suggerimento spiega chi contattare, perché e con quale messaggio." secondary={{ label: "Vedi i prezzi", href: "/prezzi" }} />
    <section className="section"><div className="section-title"><span>Funzioni</span><h2>Tutto ciò che serve per non perdere occasioni.</h2></div><div className="feature-list">{features.map(([title, copy], index) => <article key={title}><span>0{index + 1}</span><div><h2>{title}</h2><p>{copy}</p></div></article>)}</div></section>
    <section className="plain-band"><div><span>Il controllo resta a te</span><h2>L’intelligenza artificiale propone. Le persone decidono.</h2></div><p>Prima di inviare un messaggio puoi leggerlo, modificarlo o scartarlo. AgendaPiena non sostituisce il rapporto umano: aiuta il team a curarlo con più costanza.</p></section>
    <SiteFooter /></main>;
}

