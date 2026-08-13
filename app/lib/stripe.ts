export const stripePlans = {
  agenda_clienti: { name: "Agenda e clienti", monthlyAmountCents: 39000, recurringEnv: "STRIPE_PRICE_AGENDA_CLIENTI", setupEnv: "STRIPE_PRICE_SETUP_AGENDA_CLIENTI", voiceMinutes: 0, whatsappMessages: 1000, voiceOverageCents: 0, whatsappOverageCents: 10, voiceEnabled: false, whatsappEnabled: true, maxVoiceAgents: 0, maxPhoneNumbers: 0 },
  tutto_in_uno: { name: "Tutto in uno", monthlyAmountCents: 56900, recurringEnv: "STRIPE_PRICE_TUTTO_IN_UNO", setupEnv: "STRIPE_PRICE_SETUP_TUTTO_IN_UNO", voiceMinutes: 300, whatsappMessages: 1000, voiceOverageCents: 40, whatsappOverageCents: 10, voiceEnabled: true, whatsappEnabled: true, maxVoiceAgents: 1, maxPhoneNumbers: 1 },
  voce_base: { name: "Voce Base", monthlyAmountCents: 19900, recurringEnv: "STRIPE_PRICE_VOCE_BASE", setupEnv: "STRIPE_PRICE_SETUP_VOCE_BASE", voiceMinutes: 300, whatsappMessages: 0, voiceOverageCents: 40, whatsappOverageCents: 0, voiceEnabled: true, whatsappEnabled: false, maxVoiceAgents: 1, maxPhoneNumbers: 1 },
  voce_attivita: { name: "Voce Attività", monthlyAmountCents: 34900, recurringEnv: "STRIPE_PRICE_VOCE_ATTIVITA", setupEnv: "STRIPE_PRICE_SETUP_VOCE_ATTIVITA", voiceMinutes: 700, whatsappMessages: 0, voiceOverageCents: 35, whatsappOverageCents: 0, voiceEnabled: true, whatsappEnabled: false, maxVoiceAgents: 1, maxPhoneNumbers: 1 },
  voce_azienda: { name: "Voce Azienda", monthlyAmountCents: 64900, recurringEnv: "STRIPE_PRICE_VOCE_AZIENDA", setupEnv: "STRIPE_PRICE_SETUP_VOCE_AZIENDA", voiceMinutes: 1500, whatsappMessages: 0, voiceOverageCents: 30, whatsappOverageCents: 0, voiceEnabled: true, whatsappEnabled: false, maxVoiceAgents: 1, maxPhoneNumbers: 1 },
} as const;

export type StripePlanKey = keyof typeof stripePlans;

function secretKey() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe non è ancora collegato");
  return key;
}

async function stripeRequest<T>(path: string, body: URLSearchParams) {
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secretKey()}`, "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  const result = await response.json() as T & { error?: { message?: string } };
  if (!response.ok) throw new Error(result.error?.message || "Stripe non ha completato la richiesta");
  return result;
}

async function stripeGet<T>(path: string) {
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    headers: { Authorization: `Bearer ${secretKey()}` },
    cache: "no-store",
  });
  const result = await response.json() as T & { error?: { message?: string } };
  if (!response.ok) throw new Error(result.error?.message || "Stripe non ha restituito l’abbonamento");
  return result;
}

export async function retrieveStripeSubscription(subscriptionId: string) {
  return stripeGet<Record<string, unknown>>(`subscriptions/${encodeURIComponent(subscriptionId)}`);
}

export function isStripePlanKey(value: unknown): value is StripePlanKey {
  return typeof value === "string" && value in stripePlans;
}

export function configuredStripePlans() {
  return Object.entries(stripePlans).filter(([key, plan]) => Boolean(process.env[plan.recurringEnv]) || (key === "agenda_clienti" && process.env.STRIPE_PRICE_ID)).map(([key]) => key as StripePlanKey);
}

export function stripePlanFromPriceId(priceId: unknown): StripePlanKey | null {
  if (typeof priceId !== "string" || !priceId) return null;
  for (const [key, plan] of Object.entries(stripePlans)) {
    const configured = process.env[plan.recurringEnv] || (key === "agenda_clienti" ? process.env.STRIPE_PRICE_ID : undefined);
    if (configured === priceId) return key as StripePlanKey;
  }
  return null;
}

export function stripeIsConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET && configuredStripePlans().length);
}

export async function createCheckoutSession(input: { email: string; organizationId: string; organizationName: string; origin: string; planKey: StripePlanKey }) {
  const plan = stripePlans[input.planKey];
  const recurringPrice = process.env[plan.recurringEnv] || (input.planKey === "agenda_clienti" ? process.env.STRIPE_PRICE_ID : undefined);
  if (!recurringPrice) throw new Error(`Il piano ${plan.name} non è ancora disponibile per il pagamento online`);
  const body = new URLSearchParams({
    mode: "subscription",
    customer_email: input.email,
    client_reference_id: input.organizationId,
    success_url: `${input.origin}/admin/abbonamento?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${input.origin}/admin/abbonamento?checkout=cancelled`,
    "line_items[0][price]": recurringPrice,
    "line_items[0][quantity]": "1",
    "metadata[organization_id]": input.organizationId,
    "metadata[organization_name]": input.organizationName,
    "metadata[plan_key]": input.planKey,
    "subscription_data[metadata][organization_id]": input.organizationId,
    "subscription_data[metadata][plan_key]": input.planKey,
    "billing_address_collection": "required",
    "tax_id_collection[enabled]": "true",
    locale: "it",
  });
  const setupPrice = process.env[plan.setupEnv];
  if (setupPrice) {
    body.set("line_items[1][price]", setupPrice);
    body.set("line_items[1][quantity]", "1");
  }
  return stripeRequest<{ url: string; id: string }>("checkout/sessions", body);
}

export async function createCustomerPortalSession(input: { customerId: string; returnUrl: string }) {
  const body = new URLSearchParams({ customer: input.customerId, return_url: input.returnUrl });
  if (process.env.STRIPE_PORTAL_CONFIGURATION_ID) body.set("configuration", process.env.STRIPE_PORTAL_CONFIGURATION_ID);
  return stripeRequest<{ url: string; id: string }>("billing_portal/sessions", body);
}
