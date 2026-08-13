import { updateSubscriptionFromStripe } from "../../../lib/repository";
import { enforceBillingAfterSubscriptionChange } from "../../../lib/billing-enforcement";
import { retrieveStripeSubscription } from "../../../lib/stripe";
import { claimStripeWebhookEvent, completeStripeWebhookEvent, failStripeWebhookEvent, type StripeWebhookEvent } from "../../../lib/stripe-webhook-events";

function hex(bytes: ArrayBuffer) { return Array.from(new Uint8Array(bytes)).map((byte) => byte.toString(16).padStart(2, "0")).join(""); }
function sameSignature(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

async function validSignature(payload: string, header: string, secret: string) {
  const values = header.split(",").map((part) => part.trim().split("=", 2));
  const timestamp = values.find(([key]) => key === "t")?.[1];
  const signatures = values.filter(([key]) => key === "v1").map(([, value]) => value);
  if (!timestamp || !signatures.length || !/^\d+$/.test(timestamp)) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const expected = hex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${payload}`)));
  return signatures.some((signature) => sameSignature(expected, signature));
}

const acceptedEvents = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.subscription.paused",
  "customer.subscription.resumed",
]);

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !signature || !(await validSignature(payload, signature, secret))) return Response.json({ ok: false, error: "Firma Stripe non valida" }, { status: 400 });
  let event: StripeWebhookEvent;
  try { event = JSON.parse(payload); } catch { return Response.json({ ok: false, error: "Evento non valido" }, { status: 400 }); }
  if (!event.id || !event.type || !event.data?.object) return Response.json({ ok: false, error: "Evento incompleto" }, { status: 400 });
  if (acceptedEvents.has(event.type)) {
    if (!(await claimStripeWebhookEvent(event))) return Response.json({ received: true, duplicate: true });
    try {
      const latestEvent = await withLatestSubscription(event);
      const result = await updateSubscriptionFromStripe(latestEvent);
      if (result.updated && result.organizationId) await enforceBillingAfterSubscriptionChange(result.organizationId);
      await completeStripeWebhookEvent(event.id);
    } catch (error) {
      await failStripeWebhookEvent(event.id, error);
      return Response.json({ received: false, error: "Elaborazione Stripe non riuscita; il tentativo verrà ripetuto" }, { status: 500 });
    }
  }
  return Response.json({ received: true });
}

async function withLatestSubscription(event: StripeWebhookEvent): Promise<StripeWebhookEvent> {
  const object = event.data.object;
  const checkout = event.type.startsWith("checkout.session.");
  const subscriptionId = checkout ? typeof object.subscription === "string" ? object.subscription : null : typeof object.id === "string" ? object.id : null;
  if (!subscriptionId) return event;
  const latest = await retrieveStripeSubscription(subscriptionId);
  return checkout ? {
    ...event,
    data: { object: { ...latest, subscription: subscriptionId, client_reference_id: object.client_reference_id, payment_status: object.payment_status, customer: latest.customer || object.customer } },
  } : { ...event, data: { object: latest } };
}
