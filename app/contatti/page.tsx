import type { Metadata } from "next";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { LeadForm } from "../components/LeadForm";
export const metadata: Metadata = { title: "Prenota una demo di AgendaPiena AI", description: "Raccontaci come lavora il tuo centro. Valutiamo insieme clienti da recuperare, orari liberi e possibile ritorno economico.", alternates: { canonical: "/contatti" } };
export default function ContactPage() { return <main><SiteHeader /><section className="contact-page"><div><span className="eyebrow">Valutazione riservata</span><h1>Vediamo quanto valore resta nella tua agenda.</h1><p>Raccontaci come lavora il tuo centro. Valuteremo strumenti, appuntamenti e valore medio dei trattamenti per capire se AgendaPiena può produrre un risultato concreto.</p><div className="contact-notes"><span>01 · Analisi senza impegno</span><span>02 · Nessuna attivazione automatica</span><span>03 · Dati trattati solo per la richiesta</span></div></div><LeadForm /></section><SiteFooter /></main>; }
