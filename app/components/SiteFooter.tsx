import Link from "next/link";
import { legalEntity } from "../lib/legal";
import { cities, contactHref } from "../lib/site";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <strong>AgendaPiena AI</strong>
        <p>L’assistente che trova occasioni nell’agenda e prepara il lavoro da fare.</p>
        <a href={contactHref}>{legalEntity.email}</a>
        <a href={`tel:${legalEntity.phoneHref}`}>{legalEntity.phone}</a>
      </div>
      <div>
        <strong>Scopri</strong>
        <Link href="/prodotto">Prodotto</Link>
        <Link href="/assistente-vocale-ai">Assistente vocale AI</Link>
        <Link href="/come-funziona">Come funziona</Link>
        <Link href="/prezzi">Prezzi</Link>
        <Link href="/contatti">Contatti</Link>
        <Link href="/accesso">Area riservata</Link>
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
        <span>© 2026 AgendaPiena AI · {legalEntity.name} · P.IVA {legalEntity.vatNumber}</span>
        <Link href="/privacy">Privacy</Link>
        <Link href="/termini">Termini</Link>
      </div>
    </footer>
  );
}
