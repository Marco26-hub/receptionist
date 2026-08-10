import type { Metadata } from "next";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
export const metadata: Metadata = { title: "Informativa sulla privacy", robots: { index: false, follow: true } };
export default function PrivacyPage() { return <main><SiteHeader /><article className="legal-page"><h1>Informativa sulla privacy</h1><p>Questa pagina sarà aggiornata con i dati completi del titolare del trattamento prima della pubblicazione commerciale. Per richieste relative ai dati personali, scrivi a <a href="mailto:privacy@agendapiena.ai">privacy@agendapiena.ai</a>.</p><h2>Dati inviati volontariamente</h2><p>Quando ci contatti riceviamo le informazioni che scegli di inserire nel messaggio. Le usiamo soltanto per rispondere alla richiesta e organizzare l’eventuale dimostrazione.</p><h2>Dati dei clienti dei centri</h2><p>Ogni trattamento di dati per conto di un centro sarà regolato da un accordo specifico, con ruoli, finalità, tempi di conservazione e misure di sicurezza definiti prima dell’attivazione.</p></article><SiteFooter /></main>; }

