import type { Metadata } from "next";
import { PageIntro } from "../components/PageIntro";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

export const metadata: Metadata = { title: "Come funziona AgendaPiena AI", description: "Dall’importazione dei dati ai messaggi WhatsApp: scopri come AgendaPiena AI aiuta a recuperare clienti e riempire l’agenda.", alternates: { canonical: "/come-funziona" } };

const phases = [
  ["1. Conosciamo il centro", "Definiamo servizi, durata degli appuntamenti, tono dei messaggi e regole commerciali. L’obiettivo è far lavorare l’assistente come una persona del team."],
  ["2. Importiamo agenda e clienti", "Partiamo da un file CSV, da Google Calendar o dal gestionale disponibile. Puliamo i dati e controlliamo che siano utilizzabili."],
  ["3. Troviamo le priorità", "Ogni giorno l’assistente cerca clienti da recuperare, orari liberi, controlli mancanti e percorsi da riprendere."],
  ["4. Prepariamo i messaggi", "Il testo viene adattato alla persona, al trattamento e al momento. Lo staff può approvare o modificare tutto da telefono."],
  ["5. Misuriamo ciò che accade", "Tracciamo risposte, prenotazioni e valore recuperato. Il report settimanale mostra cosa funziona e cosa migliorare."],
];

export default function HowPage() { return <main><SiteHeader /><PageIntro eyebrow="Come funziona" title="Dai dati agli appuntamenti, senza complicazioni." description="Non devi cambiare tutto. Partiamo dagli strumenti che usi già, impostiamo le regole insieme e ti consegniamo ogni giorno una lista breve di azioni da approvare." secondary={{ label: "Scopri il prodotto", href: "/prodotto" }} /><section className="section"><div className="process-list">{phases.map(([title, copy]) => <article key={title}><h2>{title}</h2><p>{copy}</p></article>)}</div></section><section className="faq-section"><span>Domande frequenti</span><h2>Cosa serve per iniziare?</h2><details><summary>Devo cambiare gestionale?</summary><p>No. Verifichiamo prima i dati che puoi esportare e costruiamo il collegamento più semplice.</p></details><details><summary>I messaggi partono da soli?</summary><p>No. Nella fase iniziale ogni messaggio richiede la tua approvazione. Le automazioni si attivano solo quando sono state concordate.</p></details><details><summary>Quanto tempo richiede allo staff?</summary><p>In genere bastano pochi minuti al giorno per controllare le azioni proposte e gestire le risposte importanti.</p></details></section><SiteFooter /></main>; }

