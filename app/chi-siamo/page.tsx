import type { Metadata } from "next";
import { PageIntro } from "../components/PageIntro";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
export const metadata: Metadata = { title: "Chi siamo | AgendaPiena AI", description: "AgendaPiena AI nasce per rendere l’intelligenza artificiale semplice, controllabile e utile ai centri estetici italiani.", alternates: { canonical: "/chi-siamo" } };
export default function AboutPage() { return <main><SiteHeader /><PageIntro eyebrow="Chi siamo" title="Tecnologia utile, con le persone al comando." description="Costruiamo strumenti semplici per attività che vivono di relazione. AgendaPiena nasce da un’idea precisa: l’intelligenza artificiale deve togliere lavoro ripetitivo, senza togliere umanità." /><section className="plain-band"><div><span>La nostra scelta</span><h2>Poche promesse. Risultati misurabili.</h2></div><p>Partiamo dai dati reali del centro, concordiamo le regole e misuriamo appuntamenti recuperati e tempo risparmiato. Non vendiamo automazioni incomprensibili.</p></section><SiteFooter /></main>; }

