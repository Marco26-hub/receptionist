import type { Metadata } from "next";
import { JsonLd } from "../components/JsonLd";
import { PageIntro } from "../components/PageIntro";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { contactHref, siteUrl } from "../lib/site";

export const metadata: Metadata = {
  title: "Prezzi AgendaPiena AI",
  description: "Prezzi chiari per AgendaPiena AI: crescita clienti da €390 al mese e assistente vocale da €189 al mese, con configurazione guidata.",
  alternates: { canonical: "/prezzi" },
};

export default function PricingPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: [
      { "@type": "Product", name: "AgendaPiena Growth", offers: { "@type": "Offer", price: "390", priceCurrency: "EUR", url: `${siteUrl}/prezzi` } },
      { "@type": "Product", name: "AgendaPiena Voice Start", offers: { "@type": "Offer", price: "189", priceCurrency: "EUR", url: `${siteUrl}/assistente-vocale-ai` } },
    ],
  };

  return <main>
    <JsonLd data={schema} />
    <SiteHeader />
    <PageIntro eyebrow="Prezzi chiari" title="Scegli il lavoro che vuoi toglierti di dosso." description="Puoi iniziare dal recupero clienti, dalle chiamate o unire i due servizi. Prima dell’attivazione sai sempre cosa è incluso e quanto costa." />
    <section className="pricing-page">
      <article><span>AgendaPiena Growth</span><strong>€390</strong><p>al mese · configurazione €790</p><ul><li>Analisi quotidiana di clienti e agenda</li><li>Messaggi WhatsApp da approvare</li><li>Recupero clienti e orari vuoti</li><li>Report settimanale dei risultati</li><li>Assistenza e miglioramento continuo</li></ul></article>
      <article className="featured-price"><span>AgendaPiena Voice</span><strong>da €189</strong><p>al mese · configurazione da €490</p><ul><li>Da 500 minuti di chiamata</li><li>Numero telefonico italiano</li><li>Risposte e prenotazioni automatiche</li><li>Analisi e prove scaricabili</li><li>Passaggio della chiamata allo staff</li></ul><a href="/assistente-vocale-ai">Vedi i piani Voice</a></article>
    </section>
    <section className="pricing-complete"><span>Per chi vuole un unico sistema</span><h2>Voice + Growth, con un solo progetto.</h2><p>La segretaria risponde e organizza le richieste; AgendaPiena continua il lavoro su WhatsApp e recupera le opportunità rimaste ferme. Il prezzo viene calcolato su minuti, sedi e integrazioni reali.</p><a href={contactHref}>Richiedi la proposta completa</a></section>
    <section className="faq-section"><span>Prima di decidere</span><h2>Domande sui prezzi</h2><details><summary>Ci sono costi nascosti?</summary><p>No. Minuti inclusi, consumo extra ed eventuali costi telefonici vengono indicati nella proposta prima dell’attivazione. I prezzi sono IVA esclusa.</p></details><details><summary>Posso partire con una sola sede?</summary><p>Sì. Consigliamo di iniziare con una sede, misurare i risultati e poi estendere il servizio.</p></details><details><summary>Quanto devo recuperare per coprire il costo?</summary><p>Dipende dal valore medio di un appuntamento o di un ordine. Durante la demo calcoliamo il punto di pareggio usando i tuoi numeri.</p></details></section>
    <SiteFooter />
  </main>;
}
