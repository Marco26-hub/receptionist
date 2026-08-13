import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CalendarClock, CheckCircle2, CreditCard, MessageCircle, PhoneCall, ShieldAlert } from "lucide-react";
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
  const entitlements = data.entitlements;
  const amount = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format((subscription?.monthlyAmountCents || 0) / 100);
  const renewal = subscription?.currentPeriodEnd ? new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(subscription.currentPeriodEnd)) : "Non disponibile";

  return <main className="billing-page">
    <Link href="/admin/configurazione"><ArrowLeft size={17} /> Torna alla configurazione</Link>
    <header><div><span>Piano e pagamenti</span><h1>Il tuo abbonamento</h1><p>Controlla cosa risulta attivo e quando è previsto il prossimo rinnovo.</p></div><CreditCard size={34} /></header>
    {query.checkout === "success" && <p className="billing-feedback success">Pagamento ricevuto. Lo stato del piano si aggiorna appena Stripe completa la conferma.</p>}
    {query.checkout === "cancelled" && <p className="billing-feedback">Pagamento annullato: non è stato modificato alcun piano.</p>}
    {subscription ? <section className="billing-summary">
      <div><small>Piano</small><strong>{entitlements.planName || subscription.plan}</strong></div>
      <div><small>Stato</small><strong><CheckCircle2 size={17} /> {statusLabel[subscription.status] || subscription.status}</strong></div>
      <div><small>Importo mensile</small><strong>{amount}</strong></div>
      <div><small>Prossima scadenza</small><strong><CalendarClock size={17} /> {renewal}</strong></div>
    </section> : <section className="billing-empty"><CreditCard size={26} /><h2>Nessun piano attivo</h2><p>Scegli il servizio adatto alla tua attività. Prima dell’attivazione vedrai prezzo, volumi inclusi e costi aggiuntivi.</p><Link href="/prezzi">Vedi piani e prezzi</Link></section>}
    {!entitlements.enforcementEnabled && <div className="billing-enforcement-warning"><ShieldAlert size={20} /><p><strong>Controllo automatico non ancora attivo.</strong> I consumi vengono misurati, ma il motore non sospende ancora i servizi in base al pagamento. Attivalo soltanto dopo il collaudo Stripe.</p></div>}
    {entitlements.inGracePeriod && <div className="billing-enforcement-warning"><ShieldAlert size={20} /><p><strong>Pagamento da sistemare.</strong> I servizi restano disponibili fino al {new Date(entitlements.graceUntil!).toLocaleDateString("it-IT")}; dopo verranno sospesi automaticamente.</p></div>}
    <section className="billing-usage">
      <header><div><span>Consumi del periodo</span><h2>Volumi chiari, senza sorprese</h2></div><small>{new Date(entitlements.periodStart).toLocaleDateString("it-IT")} – {new Date(entitlements.periodEnd).toLocaleDateString("it-IT")}</small></header>
      <div className="billing-usage-grid">
        <UsageCard icon="voice" title="Minuti voce" unit="min" usage={entitlements.voice} />
        <UsageCard icon="whatsapp" title="Messaggi WhatsApp" unit="invii" usage={entitlements.whatsapp} />
      </div>
    </section>
    <BillingActions canManage={["owner", "manager"].includes(session.role)} hasCustomer={Boolean(subscription?.stripeCustomerId)} stripeConfigured={data.stripeConfigured} plans={Object.entries(stripePlans).map(([key, plan]) => ({ key, name: plan.name, price: new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(plan.monthlyAmountCents / 100) + "/mese", configured: data.configuredPlans.includes(key), details: [plan.voiceMinutes ? `${plan.voiceMinutes.toLocaleString("it-IT")} min` : null, plan.whatsappMessages ? `${plan.whatsappMessages.toLocaleString("it-IT")} invii` : null].filter(Boolean).join(" · ") }))} />
    <aside className="billing-help"><div><strong>Pagamento e variazioni trasparenti</strong><p>Nel portale Stripe puoi aggiornare la carta, scaricare le fatture, cambiare piano o disdire. Le eccedenze mostrate sopra sono una stima maturata e vengono conguagliate secondo il contratto; ogni importo viene indicato prima dell’addebito.</p></div><Link href="/contatti">Contatta l’assistenza</Link></aside>
  </main>;
}

function UsageCard({ icon, title, unit, usage }: { icon: "voice" | "whatsapp"; title: string; unit: string; usage: { included: number; used: number; remaining: number; overage: number; overageRateCents: number; estimatedOverageCents: number; enabled: boolean; allowed: boolean; reason: string | null } }) {
  const Icon = icon === "voice" ? PhoneCall : MessageCircle;
  const percent = usage.included ? Math.min(100, Math.round((usage.used / usage.included) * 100)) : 0;
  return <article className={!usage.enabled ? "disabled" : usage.overage > 0 ? "overage" : ""}><header><Icon size={20} /><div><strong>{title}</strong><small>{usage.enabled ? usage.allowed ? "Disponibile" : "Sospeso" : "Non incluso nel piano"}</small></div></header><div className="usage-numbers"><strong>{usage.used.toLocaleString("it-IT")}</strong><span>di {usage.included.toLocaleString("it-IT")} {unit}</span></div><div className="usage-track"><i style={{ width: `${percent}%` }} /></div>{usage.overage > 0 ? <p><strong>Eccedenza: {usage.overage.toLocaleString("it-IT")} {unit}</strong> · stima {new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(usage.estimatedOverageCents / 100)}</p> : usage.enabled ? <p>Restano {usage.remaining.toLocaleString("it-IT")} {unit}. Oltre la soglia: €{(usage.overageRateCents / 100).toFixed(2).replace(".", ",")} per {unit === "min" ? "minuto" : "invio"}.</p> : <p>{usage.reason || "Questo servizio richiede un piano diverso."}</p>}</article>;
}
