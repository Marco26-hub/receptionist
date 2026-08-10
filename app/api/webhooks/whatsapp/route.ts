import { recordWhatsAppEvent } from "../../../lib/repository";
import { verifyHmacHex } from "../../../lib/security";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  if (mode === "subscribe" && token && token === process.env.WHATSAPP_VERIFY_TOKEN) return new Response(challenge || "", { status: 200 });
  return new Response("Forbidden", { status: 403 });
}

export async function POST(request: Request) {
  const raw = await request.text();
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  const signature = request.headers.get("x-hub-signature-256")?.replace("sha256=", "");
  if (process.env.NODE_ENV === "production" && (!appSecret || !signature || !(await verifyHmacHex(raw, signature, appSecret)))) return Response.json({ received: false }, { status: 401 });
  const payload = JSON.parse(raw) as { entry?: Array<{ changes?: Array<{ value?: { messages?: Array<{ from?: string; id?: string; text?: { body?: string } }>; statuses?: Array<{ id?: string; status?: string }> } }> }> };
  for (const entry of payload.entry || []) for (const change of entry.changes || []) {
    for (const message of change.value?.messages || []) await recordWhatsAppEvent({ from: message.from, body: message.text?.body, externalId: message.id, raw: message as unknown as Record<string, unknown> });
    for (const status of change.value?.statuses || []) await recordWhatsAppEvent({ externalId: status.id, status: status.status, raw: status as unknown as Record<string, unknown> });
  }
  return Response.json({ received: true });
}
