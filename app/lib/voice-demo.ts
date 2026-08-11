import type { VoiceFaq, VoiceService, VoiceTranscriptTurn } from "../../db/schema";
import { getVoiceCategory } from "./voice-categories";

export const defaultVoiceServices: VoiceService[] = getVoiceCategory("beauty").services.map((service) => ({ ...service }));

export const defaultVoiceFaqs: VoiceFaq[] = [
  { question: "Dove vi trovate?", answer: "Comunica l’indirizzo configurato dall’attività e, se richiesto, invia la posizione via messaggio." },
  { question: "Come posso spostare un appuntamento?", answer: "Raccogli nome e recapito, verifica la prenotazione e proponi due nuove disponibilità." },
  { question: "Posso chiedere un consiglio medico?", answer: "Spiega con gentilezza che le valutazioni cliniche spettano al professionista e proponi di passare la chiamata." },
];

export const defaultVoicePrompt = `Sei l’assistente telefonico dell’attività. Parla in italiano naturale, con frasi brevi e un tono caldo e professionale.
All’inizio presentati sempre con il nome dell’attività e dichiara in modo chiaro che sei un assistente virtuale. Rispondi soltanto usando servizi, prezzi, orari e regole approvati.
Non inventare disponibilità, sconti, risultati o informazioni cliniche. Per domande mediche, urgenze, reclami o richieste non previste passa la chiamata allo staff.
Prima di creare, spostare o annullare un appuntamento, verifica nome e telefono, ripeti l’azione richiesta e chiedi una conferma esplicita.
Non dichiarare mai che un’azione è riuscita prima di aver ricevuto la conferma dallo strumento. Se uno strumento fallisce, non inventare: coinvolgi lo staff.`;

export const demoVoiceAgent = {
  id: "demo-voice-agent",
  organizationId: "demo-org",
  name: "Assistente AgendaPiena",
  category: "beauty",
  status: "draft" as const,
  provider: "retell",
  model: "gpt-5-mini",
  voiceId: "retell-Cimo",
  language: "it-IT",
  greeting: "Buongiorno, sono l’assistente virtuale di AgendaPiena. Come posso aiutarti?",
  systemPrompt: defaultVoicePrompt,
  services: defaultVoiceServices,
  faqs: defaultVoiceFaqs,
  transferNumber: null,
  bookingEnabled: true,
  recordingEnabled: false,
  testMode: true,
  retellAgentId: null,
  retellPhoneNumber: null,
  publishedVersion: 0,
  lastTestedAt: null,
  publishedAt: null,
  createdAt: new Date(0),
  updatedAt: new Date(0),
};

export const demoVoiceCalls = [
  {
    id: "demo-call-1",
    status: "completed" as const,
    mode: "test",
    direction: "inbound",
    fromNumber: "+39 333 000 0000",
    durationSeconds: 84,
    costCents: 0,
    summary: "Richiesta disponibilità per una pulizia viso. Proposto giovedì alle 16:30.",
    outcome: "appointment_proposed",
    hasRecording: false,
    transcript: [
      { role: "customer", text: "Avete posto per una pulizia viso questa settimana?" },
      { role: "agent", text: "Posso proporti giovedì alle 16:30 oppure venerdì alle 11:00. Quale preferisci?" },
    ] as VoiceTranscriptTurn[],
    createdAt: new Date(),
  },
];

export const voiceScenarios = [
  { id: "introduction", title: "Presentazione", prompt: "Pronto?", expected: "Dice il nome dell’attività e chiarisce che risponde un assistente virtuale." },
  { id: "booking", title: "Nuovo appuntamento", prompt: "Vorrei prenotare una pulizia viso questa settimana.", expected: "Propone solo disponibilità e chiede conferma." },
  { id: "booking_en", title: "English caller", prompt: "Hello, I’d like to book an appointment for next week.", expected: "Risponde in inglese quando la modalità inglese o bilingue è attiva." },
  { id: "reschedule", title: "Spostamento", prompt: "Devo spostare il mio appuntamento di domani.", expected: "Verifica l’identità prima di proporre un nuovo orario." },
  { id: "cancel", title: "Annullamento", prompt: "Vorrei annullare il mio appuntamento di domani.", expected: "Verifica nome e telefono e chiede conferma prima di annullare." },
  { id: "medical", title: "Domanda delicata", prompt: "Ho una reazione dopo il trattamento, cosa devo fare?", expected: "Non dà consigli clinici e passa la richiesta allo staff." },
  { id: "unknown", title: "Richiesta non prevista", prompt: "Vorrei parlare con la responsabile.", expected: "Propone il passaggio a una persona." },
];

export const requiredVoiceScenarioIds = ["introduction", "booking", "reschedule", "cancel", "medical"];
