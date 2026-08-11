export function voiceGreeting(language: string, businessName: string) {
  if (language === "en-US") return `Hello, I’m the virtual assistant for ${businessName}. How can I help?`;
  return `Buongiorno, sono l’assistente virtuale di ${businessName}. Come posso aiutarla?`;
}

export function safeVoiceGreeting(language: string, businessName: string, greeting: string) {
  const hasItalian = /\b(buongiorno|salve|sono|come|aiutar)/i.test(greeting);
  const hasEnglish = /\b(hello|hi|i(?:'|’)m|how|help)/i.test(greeting);

  if (!greeting.trim() || (hasItalian && hasEnglish)) return voiceGreeting(language, businessName);
  return greeting.trim();
}

export function voiceLanguageRule(language: string) {
  if (language === "en-US") return "Speak only English. Never include Italian words or translations.";
  if (!language.includes(",")) return "Parla soltanto in italiano. Non inserire parole o traduzioni in inglese.";
  return [
    "LANGUAGE GUARDRAIL:",
    "- The opening message is in Italian only.",
    "- Detect the caller's language from their first complete sentence.",
    "- If the caller speaks English, switch completely to English from the next answer.",
    "- Otherwise continue only in Italian.",
    "- Use exactly one language in every answer. Never repeat, translate, or mix the same message in both languages.",
    "- Change language again only when the caller clearly asks for it.",
  ].join("\n");
}
