import type { Metadata } from "next";
import { PageIntro } from "../components/PageIntro";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

export const metadata: Metadata = { title: "Come funziona AgendaPiena AI", description: "Dall’importazione dei dati ai messaggi WhatsApp: scopri come AgendaPiena AI aiuta a recuperare clienti e riempire l’agenda.", alternates: { canonical: "/come-funziona" } };

const phases = [
  ["1. Configuriamo il centro", "Definiamo servizi, durata degli appuntamenti, tono, regole commerciali e limiti operativi. Il sistema si adatta all’attività, non il contrario."],
  ["2. Importiamo agenda e clienti", "Partiamo da CSV, calendario o gestionale. Normalizziamo telefoni, servizi, appuntamenti e storico."],
  ["3. Verifichiamo il consenso", "Escludiamo automaticamente chi non può o non vuole essere contattato. Il consenso e ogni modifica restano registrati."],
  ["4. Analizziamo le occasioni", "Il motore cerca clienti che non tornano, spazi liberi, percorsi interrotti e controlli organizzativi da fissare."],
  ["5. Assegniamo una priorità", "Ogni occasione riceve un punteggio spiegabile basato su tempo, compatibilità, valore storico e momento utile."],
  ["6. Prepariamo la bozza", "L’intelligenza artificiale scrive un messaggio breve usando soltanto informazioni reali e il tono approvato dal centro."],
  ["7. Una persona approva", "Il titolare o lo staff può leggere, modificare, approvare o scartare. Senza approvazione il messaggio non parte."],
  ["8. WhatsApp gestisce il contatto", "Il messaggio viene inviato dal numero configurato. Consegna, lettura e risposta aggiornano lo stato della conversazione."],
  ["9. La risposta diventa azione", "Lo staff interviene quando serve, propone un orario e registra l’appuntamento recuperato."],
  ["10. Il sistema migliora", "Report e audit mostrano quali regole producono risultati. Il punteggio viene affinato senza perdere trasparenza e controllo."],
];

export default function HowPage() { return <main><SiteHeader /><PageIntro eyebrow="Come funziona" title="Dai dati agli appuntamenti, senza complicazioni." description="Non devi cambiare tutto. Partiamo dagli strumenti che usi già, impostiamo le regole insieme e ti consegniamo ogni giorno una lista breve di azioni da approvare." secondary={{ label: "Scopri il prodotto", href: "/prodotto" }} /><section className="section"><div className="process-list">{phases.map(([title, copy]) => <article key={title}><h2>{title}</h2><p>{copy}</p></article>)}</div></section><section className="faq-section"><span>Domande frequenti</span><h2>Cosa serve per iniziare?</h2><details><summary>Devo cambiare gestionale?</summary><p>No. Verifichiamo prima i dati che puoi esportare e costruiamo il collegamento più semplice.</p></details><details><summary>I messaggi partono da soli?</summary><p>No. Nella fase iniziale ogni messaggio richiede la tua approvazione. Le automazioni si attivano solo quando sono state concordate.</p></details><details><summary>Quanto tempo richiede allo staff?</summary><p>In genere bastano pochi minuti al giorno per controllare le azioni proposte e gestire le risposte importanti.</p></details></section><SiteFooter /></main>; }
