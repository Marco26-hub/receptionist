"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { contactHref } from "../lib/site";

const navigation = [
  ["Prodotto", "/prodotto"],
  ["Assistente vocale AI", "/assistente-vocale-ai"],
  ["Come funziona", "/come-funziona"],
  ["Settori", "/settori"],
  ["Prezzi", "/prezzi"],
  ["Risorse", "/risorse"],
] as const;

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <header className="site-header">
      <nav className="nav" aria-label="Navigazione principale">
        <Link className="brand" href="/" aria-label="AgendaPiena AI, pagina iniziale">
          <span className="brand-mark"><Image src="/agendapiena-mark.svg" alt="" width={34} height={34} /></span>
          <span>AgendaPiena AI</span>
        </Link>
        <div className="nav-links">
          {navigation.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
          <Link href="/accesso">Accedi</Link>
        </div>
        <a className="nav-cta" href={contactHref}>Prenota una demo</a>
        <button
          aria-controls="menu-mobile"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Chiudi il menu" : "Apri il menu"}
          className="menu-toggle"
          onClick={() => setMenuOpen((open) => !open)}
          type="button"
        >
          {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </nav>
      <div className={`mobile-menu${menuOpen ? " open" : ""}`} id="menu-mobile">
        <div className="mobile-menu-links">
          {navigation.map(([label, href], index) => (
            <Link href={href} key={href} onClick={() => setMenuOpen(false)}>
              <span>0{index + 1}</span>{label}
            </Link>
          ))}
          <Link href="/accesso" onClick={() => setMenuOpen(false)}><span>07</span>Accedi all’area cliente</Link>
        </div>
        <a className="mobile-menu-cta" href={contactHref} onClick={() => setMenuOpen(false)}>Prenota una demo</a>
        <p>La segretaria AI che risponde, prenota e aiuta a riempire l’agenda.</p>
      </div>
    </header>
  );
}
