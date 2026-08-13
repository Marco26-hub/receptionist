"use client";

import { ArrowUpRight, CreditCard, LoaderCircle, Settings2 } from "lucide-react";
import { useState } from "react";

type Plan = { key: string; name: string; price: string; configured: boolean; details: string };

export function BillingActions({ plans, hasCustomer, canManage, stripeConfigured }: { plans: Plan[]; hasCustomer: boolean; canManage: boolean; stripeConfigured: boolean }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function redirect(endpoint: string, body?: Record<string, string>, loadingKey = "portal") {
    setLoading(loadingKey); setError("");
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
      const result = await response.json() as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error || "Operazione non riuscita");
      window.location.assign(result.url);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Operazione non riuscita");
      setLoading(null);
    }
  }

  return <section className="billing-actions">
    <header><div><span>Attivazione online</span><h2>Scegli il servizio</h2><p>Stripe mostra il riepilogo completo prima di chiedere il pagamento.</p></div>{hasCustomer && <button disabled={!canManage || Boolean(loading)} onClick={() => redirect("/api/admin/billing/portal")} type="button"><Settings2 size={17} /> Gestisci pagamento</button>}</header>
    {!stripeConfigured && <div className="billing-warning"><CreditCard size={18} /><p><strong>Collegamento Stripe da completare.</strong> Inserisci le chiavi API e almeno un codice prezzo nelle variabili di produzione.</p></div>}
    <div className="billing-plan-list">
      {plans.map((plan) => <article key={plan.key}>
        <div><small>Piano</small><strong>{plan.name}</strong><span>{plan.price} + eventuale avvio · {plan.details}</span></div>
        <button disabled={!canManage || hasCustomer || !plan.configured || Boolean(loading)} onClick={() => redirect("/api/checkout", { planKey: plan.key }, plan.key)} type="button">
          {loading === plan.key ? <LoaderCircle className="spin" size={17} /> : <ArrowUpRight size={17} />}
          {hasCustomer ? "Gestisci dal portale" : plan.configured ? "Vai al pagamento" : "Da collegare"}
        </button>
      </article>)}
    </div>
    {!canManage && <p className="billing-permission">Solo il titolare o un responsabile può modificare il piano.</p>}
    {error && <p className="form-error" role="alert">{error}</p>}
  </section>;
}
