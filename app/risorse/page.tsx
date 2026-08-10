import type { Metadata } from "next";
import { PageIntro } from "../components/PageIntro";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

export const metadata: Metadata = { title: "Guide per riempire l’agenda di un centro estetico", description: "Guide semplici su recupero clienti, messaggi WhatsApp e gestione degli orari liberi per centri estetici.", alternates: { canonical: "/risorse" } };

const guides = [
  ["Come recuperare le clienti che non tornano", "Un metodo semplice per scegliere chi contattare, quando farlo e cosa scrivere.", "/risorse/recuperare-clienti-centro-estetico"],
  ["Come riempire un orario libero senza fare sconti", "Usa compatibilità e tempismo per proporre un appuntamento utile, senza svalutare il trattamento.", "/risorse/riempire-orari-liberi"],
  ["Messaggi WhatsApp per centri estetici", "Esempi umani per richiami, follow-up e percorsi interrotti.", "/risorse/messaggi-whatsapp-centro-estetico"],
];

export default function ResourcesPage() { return <main><SiteHeader /><PageIntro eyebrow="Risorse" title="Idee pratiche per un’agenda più ordinata." description="Guide brevi, scritte per titolari e staff. Niente teoria complicata: esempi, criteri e messaggi da adattare al tuo centro." /><section className="section"><div className="resource-grid">{guides.map(([title, copy, href]) => <a href={href} key={href}><span>Guida</span><h2>{title}</h2><p>{copy}</p><b>Leggi la guida →</b></a>)}</div></section><SiteFooter /></main>; }

