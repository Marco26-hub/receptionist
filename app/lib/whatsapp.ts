import { normalizePhone } from "./security";
import { ValidationError } from "./validation";

export async function sendWhatsAppText(input: { to: string; body: string }) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME;
  if (!token || !phoneNumberId || !templateName) {
    if (process.env.NODE_ENV === "production") throw new ValidationError("WhatsApp non è collegato: il messaggio non è stato inviato. Apri Stato del motore per completare Meta.");
    return { id: `demo-wa-${Date.now()}`, demo: true };
  }
  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: normalizePhone(input.to),
    type: "template",
    template: {
      name: templateName,
      language: { code: process.env.WHATSAPP_TEMPLATE_LANGUAGE || "it" },
      components: [{ type: "body", parameters: [{ type: "text", text: input.body }] }],
    },
  };
  const response = await fetch(`https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION || "v23.0"}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const detail = await response.text();
    console.error("WhatsApp send failed", response.status, detail.slice(0, 500));
    throw new Error("Invio WhatsApp non riuscito");
  }
  const data = await response.json() as { messages?: Array<{ id: string }> };
  return { id: data.messages?.[0]?.id || "unknown", demo: false };
}
