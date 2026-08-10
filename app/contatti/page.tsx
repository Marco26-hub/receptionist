import type { Metadata } from "next";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
export const metadata: Metadata = { title: "Prenota una demo di AgendaPiena AI", description: "Raccontaci come lavora il tuo centro. Valutiamo insieme clienti da recuperare, orari liberi e possibile ritorno economico.", alternates: { canonical: "/contatti" } };
export default function ContactPage() { return <main><SiteHeader /><section className="contact-page"><div><span className="eyebrow">Parliamo del tuo centro</span><h1>Vediamo quante occasioni restano nella tua agenda.</h1><p>Durante la demo analizziamo il tuo modo di lavorare, gli strumenti che usi e il valore medio dei trattamenti. Ti diremo con chiarezza se AgendaPiena può esserti utile.</p></div><aside><span>Scrivici</span><a href="mailto:demo@agendapiena.ai">demo@agendapiena.ai</a><p>Inserisci il nome del centro, la città e il gestionale che usi. Ti rispondiamo per fissare una breve chiamata conoscitiva.</p><small>Nessun impegno e nessuna attivazione automatica.</small></aside></section><SiteFooter /></main>; }

