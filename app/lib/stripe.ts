export async function createCheckoutSession(input: { email: string; organizationName: string; origin: string }) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PRICE_ID) return { url: `${input.origin}/prezzi?checkout=demo`, demo: true };
  const body = new URLSearchParams({ mode: "subscription", "line_items[0][price]": process.env.STRIPE_PRICE_ID, "line_items[0][quantity]": "1", customer_email: input.email, success_url: `${input.origin}/admin?checkout=success`, cancel_url: `${input.origin}/prezzi?checkout=cancelled`, "metadata[organization_name]": input.organizationName });
  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", { method: "POST", headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded" }, body });
  if (!response.ok) throw new Error("Creazione pagamento non riuscita");
  return response.json() as Promise<{ url: string; id: string }>;
}

