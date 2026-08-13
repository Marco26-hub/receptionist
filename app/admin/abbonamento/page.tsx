import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CalendarClock, CheckCircle2, CreditCard } from "lucide-react";
import { requireAdmin } from "../../lib/auth";
import { getBillingData } from "../../lib/repository";
import { stripePlans } from "../../lib/stripe";
import { BillingActions } from "../../components/BillingActions";

export const metadata: Metadata = { title: "Piano e pagamenti", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const statusLabel: Record<string, string> = {
  active: "Attivo",
  trialing: "Periodo di prova",
  past_due: "Pagamento da verificare",
  canceled: "Terminato",
  unpaid: "Non pagato",
};

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ checkout?: string }> }) {
  const session = await requireAdmin();
  const query = await searchParams;
  const data = await getBillingData(session.organizationId);
  const subscription = data.subscription;
  const amount = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format((subscription?.monthlyAmountCents || 0) / 100);
  const renewal = subscription?.currentPeriodEnd ? new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(subscription.currentPeriodEnd)) : "Non disponibile";

  return <main className="billing-page">
    <Link href="/admin/configurazione"><ArrowLeft size={17} /> Torna alla configurazione</Link>
    <header><div><span>Piano e pagamenti</span><h1>Il tuo abbonamento</h1><p>Controlla cosa risulta attivo e quando è previsto il prossimo rinnovo.</p></div><CreditCard size={34} /></header>
    {query.checkout === "success" && <p className="billing-feedback success">Pagamento ricevuto. Lo stato del piano si aggiorna appena Stripe completa la conferma.</p>}
    {query.checkout === "cancelled" && <p className="billing-feedback">Pagamento annullato: non è stato modificato alcun piano.</p>}
    {subscription ? <section className="billing-summary">
      <div><small>Piano</small><strong>{subscription.plan}</strong></div>
      <div><small>Stato</small><strong><CheckCircle2 size={17} /> {statusLabel[subscription.status] || subscription.status}</strong></div>
      <div><small>Importo mensile</small><strong>{amount}</strong></div>
      <div><small>Prossima scadenza</small><strong><CalendarClock size={17} /> {renewal}</strong></div>
    </section> : <section className="billing-empty"><CreditCard size={26} /><h2>Nessun piano attivo</h2><p>Scegli il servizio adatto alla tua attività. Prima dell’attivazione vedrai prezzo, volumi inclusi e costi aggiuntivi.</p><Link href="/prezzi">Vedi piani e prezzi</Link></section>}
    <BillingActions canManage={["owner", "manager"].includes(session.role)} hasCustomer={Boolean(subscription?.stripeCustomerId)} stripeConfigured={data.stripeConfigured} plans={Object.entries(stripePlans).map(([key, plan]) => ({ key, name: plan.name, price: new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(plan.monthlyAmountCents / 100) + "/mese", configured: data.configuredPlans.includes(key) }))} />
    <aside className="billing-help"><div><strong>Pagamento e variazioni trasparenti</strong><p>Nel portale Stripe puoi aggiornare la carta, scaricare le fatture, cambiare piano o disdire. Ogni importo viene mostrato prima della conferma.</p></div><Link href="/contatti">Contatta l’assistenza</Link></aside>
  </main>;
}
