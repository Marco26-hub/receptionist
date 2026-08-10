import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "../../components/JsonLd";
import { PageIntro } from "../../components/PageIntro";
import { SiteFooter } from "../../components/SiteFooter";
import { SiteHeader } from "../../components/SiteHeader";
import { cities, siteUrl } from "../../lib/site";

export function generateStaticParams() { return cities.map(({ slug }) => ({ slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const city = cities.find((item) => item.slug === slug); if (!city) return {};
  return { title: `Assistente AI per centri estetici a ${city.name}`, description: `AgendaPiena AI aiuta i centri estetici di ${city.name} a recuperare clienti, riempire gli orari liberi e preparare messaggi WhatsApp.`, alternates: { canonical: `/citta/${slug}` } };
}

export default async function CityPage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const city = cities.find((item) => item.slug === slug); if (!city) notFound(); const schema = { "@context": "https://schema.org", "@type": "Service", name: `AgendaPiena AI per centri estetici a ${city.name}`, serviceType: "Assistente AI per centri estetici", areaServed: { "@type": "City", name: city.name }, provider: { "@type": "Organization", name: "AgendaPiena AI", url: siteUrl } }; return <main><JsonLd data={schema} /><SiteHeader /><PageIntro eyebrow={`AgendaPiena AI a ${city.name}`} title={`Più appuntamenti per il tuo centro estetico a ${city.name}.`} description={`Aiutiamo centri estetici e cliniche di ${city.name} a ritrovare clienti che non prenotano da tempo, riempire gli orari liberi e seguire meglio ogni percorso.`} secondary={{ label: "Scopri i prezzi", href: "/prezzi" }} /><section className="section"><div className="section-title"><span>Servizio da remoto</span><h2>Ci adattiamo al tuo centro, non il contrario.</h2><p>Analizziamo servizi, agenda e modo di comunicare. Poi configuriamo un assistente che propone azioni concrete allo staff, sempre con approvazione umana.</p></div><div className="benefit-grid"><article className="benefit-item"><span>01</span><h3>Avvio guidato</h3><p>Configurazione, importazione dei dati e prime azioni seguite insieme.</p></article><article className="benefit-item"><span>02</span><h3>Italiano naturale</h3><p>Messaggi chiari e personali, coerenti con il tono della tua attività.</p></article><article className="benefit-item"><span>03</span><h3>Controllo da telefono</h3><p>Il titolare vede le priorità e approva i messaggi ovunque si trovi.</p></article><article className="benefit-item"><span>04</span><h3>Risultati misurabili</h3><p>Appuntamenti recuperati e valore generato in un report semplice.</p></article></div></section><SiteFooter /></main>; }

