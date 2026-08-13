import { recordWhatsAppEvent } from "../../../lib/repository";
import { getWhatsAppWebhookContext, verifyWhatsAppChallenge, verifyWhatsAppWebhook } from "../../../lib/whatsapp";

type IncomingMessage = {
  from?: string;
  id?: string;
  type?: string;
  text?: { body?: string };
  button?: { text?: string; payload?: string };
  interactive?: { button_reply?: { id?: string; title?: string }; list_reply?: { id?: string; title?: string; description?: string } };
};

type StatusUpdate = { id?: string; status?: string; recipient_id?: string; errors?: Array<{ code?: number; title?: string; message?: string; error_data?: { details?: string } }> };
type WebhookValue = { metadata?: { phone_number_id?: string; display_phone_number?: string }; messages?: IncomingMessage[]; statuses?: StatusUpdate[] };
type WebhookPayload = { object?: string; entry?: Array<{ changes?: Array<{ field?: string; value?: WebhookValue }> }> };

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const organizationId = url.searchParams.get("organization");
  if (mode === "subscribe" && await verifyWhatsAppChallenge(organizationId, token)) return new Response(challenge || "", { status: 200 });
  return new Response("Forbidden", { status: 403 });
}

export async function POST(request: Request) {
  const declaredSize = Number(request.headers.get("content-length") || 0);
  if (declaredSize > 1_000_000) return Response.json({ received: false, error: "Payload troppo grande" }, { status: 413 });
  const raw = await request.text();
  if (raw.length > 1_000_000) return Response.json({ received: false, error: "Payload troppo grande" }, { status: 413 });
  let payload: WebhookPayload;
  try { payload = JSON.parse(raw) as WebhookPayload; }
  catch { return Response.json({ received: false, error: "JSON non valido" }, { status: 400 }); }
  if (payload.object !== "whatsapp_business_account") return Response.json({ received: true, ignored: true });

  const signature = request.headers.get("x-hub-signature-256");
  const organizationHint = new URL(request.url).searchParams.get("organization");
  let processed = 0;
  let ignored = 0;
  for (const entry of payload.entry || []) for (const change of entry.changes || []) {
    if (change.field && change.field !== "messages") { ignored += 1; continue; }
    const value = change.value;
    const phoneNumberId = value?.metadata?.phone_number_id || null;
    const verified = await verifyWhatsAppWebhook(raw, signature, { organizationHint, phoneNumberId });
    if (!verified && process.env.NODE_ENV === "production") return Response.json({ received: false }, { status: 401 });
    const context = verified || await getWhatsAppWebhookContext({ organizationHint, phoneNumberId });
    const organizationId = context?.organizationId || null;
    for (const message of value?.messages || []) {
      const body = inboundBody(message);
      const result = await recordWhatsAppEvent({ organizationId, phoneNumberId: phoneNumberId || undefined, from: message.from, body, externalId: message.id, messageType: message.type, raw: message as unknown as Record<string, unknown> });
      if (result.recorded) processed += 1;
      else ignored += 1;
    }
    for (const status of value?.statuses || []) {
      const result = await recordWhatsAppEvent({ organizationId, phoneNumberId: phoneNumberId || undefined, externalId: status.id, status: status.status, errors: status.errors, raw: status as unknown as Record<string, unknown> });
      if (result.recorded) processed += 1;
      else ignored += 1;
    }
  }
  return Response.json({ received: true, processed, ignored });
}

function inboundBody(message: IncomingMessage) {
  if (message.text?.body) return message.text.body;
  if (message.button?.text || message.button?.payload) return message.button.text || message.button.payload;
  if (message.interactive?.button_reply) return message.interactive.button_reply.title || message.interactive.button_reply.id;
  if (message.interactive?.list_reply) return message.interactive.list_reply.title || message.interactive.list_reply.description || message.interactive.list_reply.id;
  return undefined;
}
