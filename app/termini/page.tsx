import type { Metadata } from "next";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
export const metadata: Metadata = { title: "Termini del servizio", robots: { index: false, follow: true } };
export default function TermsPage() { return <main><SiteHeader /><article className="legal-page"><h1>Termini del servizio</h1><p>I termini contrattuali completi, inclusi livelli di servizio, responsabilità, assistenza e trattamento dei dati, saranno forniti e accettati prima di ogni attivazione.</p><h2>Uso del servizio</h2><p>AgendaPiena AI fornisce suggerimenti operativi e testi da controllare. Il cliente resta responsabile dell’approvazione delle comunicazioni e del rispetto delle norme applicabili.</p><h2>Servizi sanitari</h2><p>Il servizio non formula diagnosi, non prescrive trattamenti e non sostituisce personale sanitario qualificato.</p></article><SiteFooter /></main>; }

