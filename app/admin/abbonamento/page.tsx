import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CalendarClock, CheckCircle2, CreditCard } from "lucide-react";
import { requireAdmin } from "../../lib/auth";
import { getBillingData } from "../../lib/repository";

export const metadata: Metadata = { title: "Piano e pagamenti", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const statusLabel: Record<string, string> = {
  active: "Attivo",
  trialing: "Periodo di prova",
  past_due: "Pagamento da verificare",
  canceled: "Terminato",
  unpaid: "Non pagato",
};

export default async function BillingPage() {
  const session = await requireAdmin();
  const data = await getBillingData(session.organizationId);
  const subscription = data.subscription;
  const amount = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format((subscription?.monthlyAmountCents || 0) / 100);
  const renewal = subscription?.currentPeriodEnd ? new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(subscription.currentPeriodEnd)) : "Non disponibile";

  return <main className="billing-page">
    <Link href="/admin/configurazione"><ArrowLeft size={17} /> Torna alla configurazione</Link>
    <header><div><span>Piano e pagamenti</span><h1>Il tuo abbonamento</h1><p>Controlla cosa risulta attivo e quando è previsto il prossimo rinnovo.</p></div><CreditCard size={34} /></header>
    {subscription ? <section className="billing-summary">
      <div><small>Piano</small><strong>{subscription.plan}</strong></div>
      <div><small>Stato</small><strong><CheckCircle2 size={17} /> {statusLabel[subscription.status] || subscription.status}</strong></div>
      <div><small>Importo mensile</small><strong>{amount}</strong></div>
      <div><small>Prossima scadenza</small><strong><CalendarClock size={17} /> {renewal}</strong></div>
    </section> : <section className="billing-empty"><CreditCard size={26} /><h2>Nessun piano attivo</h2><p>Scegli il servizio adatto alla tua attività. Prima dell’attivazione vedrai prezzo, volumi inclusi e costi aggiuntivi.</p><Link href="/prezzi">Vedi piani e prezzi</Link></section>}
    <aside className="billing-help"><div><strong>Vuoi cambiare piano o dati di fatturazione?</strong><p>La modifica viene confermata soltanto dopo averti mostrato il nuovo importo e la data di decorrenza.</p></div><Link href="/contatti">Contatta l’assistenza</Link></aside>
  </main>;
}
