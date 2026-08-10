import { updateSubscriptionFromStripe } from "../../../lib/repository";

function hex(bytes: ArrayBuffer) { return Array.from(new Uint8Array(bytes)).map((byte) => byte.toString(16).padStart(2, "0")).join(""); }
async function validSignature(payload: string, header: string, secret: string) {
  const parts = Object.fromEntries(header.split(",").map((part) => part.split("=", 2)));
  if (!parts.t || !parts.v1) return false;
  if (Math.abs(Date.now() / 1000 - Number(parts.t)) > 300) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${parts.t}.${payload}`));
  return hex(signature) === parts.v1;
}
export async function POST(request: Request) {
  const payload = await request.text(); const signature = request.headers.get("stripe-signature"); const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !signature || !(await validSignature(payload, signature, secret))) return Response.json({ ok: false }, { status: 400 });
  const event = JSON.parse(payload) as { type: string; data: { object: Record<string, unknown> } };
  if (event.type.startsWith("customer.subscription.")) await updateSubscriptionFromStripe(event);
  return Response.json({ received: true });
}
