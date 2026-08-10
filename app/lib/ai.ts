type DraftInput = { firstName: string; reason: string; service?: string; toneOfVoice: string; centerName: string };

function fallbackDraft(input: DraftInput) {
  const context = input.service ? ` per ${input.service}` : "";
  return `Ciao ${input.firstName}, come stai? Ti scriviamo da ${input.centerName}: ${input.reason.toLowerCase()}${context}. Se ti fa piacere, possiamo mandarti le disponibilità più comode. A presto.`;
}

export async function generateWhatsAppDraft(input: DraftInput) {
  if (!process.env.OPENAI_API_KEY) return { body: fallbackDraft(input), provider: "template" as const };
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5-mini",
      store: false,
      instructions: "Scrivi un singolo messaggio WhatsApp in italiano naturale per un centro beauty premium. Massimo 55 parole. Sii caldo, discreto e specifico. Non inventare sconti, risultati, urgenza o informazioni mediche. Non usare emoji. Chiudi con una domanda semplice. Restituisci solo il messaggio.",
      input: `Centro: ${input.centerName}\nCliente: ${input.firstName}\nMotivo reale: ${input.reason}\nServizio: ${input.service || "non specificato"}\nTono: ${input.toneOfVoice}`,
      max_output_tokens: 140,
    }),
  });
  if (!response.ok) return { body: fallbackDraft(input), provider: "template" as const };
  const data = await response.json() as { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> };
  const body = data.output_text || data.output?.flatMap((item) => item.content || []).map((item) => item.text || "").join("").trim();
  return { body: body || fallbackDraft(input), provider: "openai" as const };
}

