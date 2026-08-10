import Link from "next/link";
import { cities, contactHref } from "../lib/site";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <strong>AgendaPiena AI</strong>
        <p>L’assistente che trova occasioni nell’agenda e prepara il lavoro da fare.</p>
        <a href={contactHref}>demo@agendapiena.ai</a>
      </div>
      <div>
        <strong>Scopri</strong>
        <Link href="/prodotto">Prodotto</Link>
        <Link href="/come-funziona">Come funziona</Link>
        <Link href="/prezzi">Prezzi</Link>
        <Link href="/contatti">Contatti</Link>
      </div>
      <div>
        <strong>Soluzioni</strong>
        <Link href="/settori/centri-estetici">Centri estetici</Link>
        <Link href="/settori/cliniche-estetiche">Cliniche estetiche</Link>
        <Link href="/chi-siamo">Chi siamo</Link>
        <Link href="/risorse">Risorse</Link>
      </div>
      <div>
        <strong>In Italia</strong>
        {cities.slice(0, 4).map((city) => (
          <Link href={`/citta/${city.slug}`} key={city.slug}>{city.name}</Link>
        ))}
      </div>
      <div className="footer-bottom">
        <span>© 2026 AgendaPiena AI</span>
        <Link href="/privacy">Privacy</Link>
        <Link href="/termini">Termini</Link>
      </div>
    </footer>
  );
}
