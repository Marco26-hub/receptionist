import Link from "next/link";
import { contactHref } from "../lib/site";

export function SiteHeader() {
  return (
    <header className="site-header">
      <nav className="nav" aria-label="Navigazione principale">
        <Link className="brand" href="/" aria-label="AgendaPiena AI, pagina iniziale">
          <span className="brand-mark">A</span>
          <span>AgendaPiena AI</span>
        </Link>
        <div className="nav-links">
          <Link href="/prodotto">Prodotto</Link>
          <Link href="/assistente-vocale-ai">Voce AI</Link>
          <Link href="/come-funziona">Come funziona</Link>
          <Link href="/settori">Per chi è</Link>
          <Link href="/prezzi">Prezzi</Link>
          <Link href="/risorse">Risorse</Link>
          <Link href="/accesso">Accedi</Link>
        </div>
        <a className="nav-cta" href={contactHref}>Prenota una demo</a>
      </nav>
    </header>
  );
}
