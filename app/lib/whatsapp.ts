import { normalizePhone } from "./security";

export async function sendWhatsAppText(input: { to: string; body: string }) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) return { id: `demo-wa-${Date.now()}`, demo: true };
  const response = await fetch(`https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION || "v23.0"}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to: normalizePhone(input.to), type: "text", text: { preview_url: false, body: input.body } }),
  });
  if (!response.ok) throw new Error("Invio WhatsApp non riuscito");
  const data = await response.json() as { messages?: Array<{ id: string }> };
  return { id: data.messages?.[0]?.id || "unknown", demo: false };
}

