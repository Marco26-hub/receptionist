import type { VoiceFaq, VoiceService } from "../../db/schema";

export type VoiceCategory = {
  id: string;
  label: string;
  description: string;
  services: VoiceService[];
  faqs: VoiceFaq[];
  rules: string;
};

export const voiceCategories: VoiceCategory[] = [
  {
    id: "beauty",
    label: "Centro estetico",
    description: "Trattamenti viso e corpo, epilazione, pacchetti e richiami.",
    services: [
      { name: "Pulizia viso", durationMinutes: 60, priceCents: 9000, enabled: true },
      { name: "Trattamento viso avanzato", durationMinutes: 75, priceCents: 13000, enabled: true },
      { name: "Trattamento corpo", durationMinutes: 75, priceCents: 12000, enabled: true },
      { name: "Massaggio corpo", durationMinutes: 60, priceCents: 8500, enabled: true },
      { name: "Epilazione", durationMinutes: 30, priceCents: 0, enabled: true },
      { name: "Manicure", durationMinutes: 45, priceCents: 3500, enabled: true },
      { name: "Pedicure estetico", durationMinutes: 60, priceCents: 4500, enabled: true },
      { name: "Consulenza iniziale", durationMinutes: 30, priceCents: 0, enabled: true },
    ],
    faqs: [
      { question: "Come mi preparo al trattamento?", answer: "Comunica solo le indicazioni approvate dal centro; per dubbi personali coinvolgi lo staff." },
      { question: "Posso spostare l’appuntamento?", answer: "Verifica nome e recapito, poi proponi due nuove disponibilità." },
    ],
    rules: "Non promettere risultati estetici e non valutare reazioni o condizioni della pelle. In questi casi coinvolgi una professionista.",
  },
  {
    id: "hair",
    label: "Parrucchiere o barber",
    description: "Taglio, colore, piega, consulenze e gestione dei tempi tecnici.",
    services: [
      { name: "Taglio e piega", durationMinutes: 60, priceCents: 5500, enabled: true },
      { name: "Colore", durationMinutes: 120, priceCents: 9000, enabled: true },
      { name: "Consulenza colore", durationMinutes: 20, priceCents: 0, enabled: true },
    ],
    faqs: [
      { question: "Quanto dura il colore?", answer: "Indica la durata prevista del servizio, non la durata del risultato; per una valutazione proponi una consulenza." },
      { question: "Posso scegliere un professionista?", answer: "Verifica le preferenze e proponi soltanto le disponibilità del professionista richiesto." },
    ],
    rules: "Per cambi colore importanti, correzioni o sensibilità del cuoio capelluto proponi una consulenza con il professionista.",
  },
  {
    id: "dental",
    label: "Studio dentistico",
    description: "Prime visite, igiene, controlli e richieste da passare allo studio.",
    services: [
      { name: "Prima visita", durationMinutes: 45, priceCents: 0, enabled: true },
      { name: "Igiene dentale", durationMinutes: 60, priceCents: 9000, enabled: true },
      { name: "Controllo", durationMinutes: 30, priceCents: 0, enabled: true },
    ],
    faqs: [
      { question: "Ho dolore, cosa devo fare?", answer: "Non fare valutazioni cliniche. Raccogli il recapito e passa subito la richiesta allo studio." },
      { question: "Quanto costa un trattamento?", answer: "Comunica solo prezzi approvati; se serve una diagnosi o un preventivo proponi una visita." },
    ],
    rules: "Verifica l’identità prima di discutere appuntamenti esistenti. Non fare diagnosi. Dolore, trauma, sanguinamento o urgenze vanno subito allo staff.",
  },
  {
    id: "clinic",
    label: "Clinica estetica o longevità",
    description: "Consulti, controlli e percorsi con forte attenzione ai dati sensibili.",
    services: [
      { name: "Prima consulenza", durationMinutes: 45, priceCents: 15000, enabled: true },
      { name: "Controllo", durationMinutes: 30, priceCents: 0, enabled: true },
      { name: "Valutazione percorso", durationMinutes: 60, priceCents: 20000, enabled: true },
    ],
    faqs: [
      { question: "Quale trattamento è adatto a me?", answer: "Non consigliare trattamenti. Proponi una valutazione con il professionista." },
      { question: "Posso parlare con un medico?", answer: "Raccogli il minimo necessario e passa la richiesta alla clinica." },
    ],
    rules: "Raccogli solo i dati indispensabili. Non formulare diagnosi, idoneità, dosaggi o aspettative di risultato. Ogni domanda clinica passa a un professionista.",
  },
  {
    id: "physio",
    label: "Fisioterapia",
    description: "Valutazioni iniziali, sedute, controlli e gestione delle urgenze.",
    services: [
      { name: "Valutazione iniziale", durationMinutes: 60, priceCents: 7000, enabled: true },
      { name: "Seduta fisioterapica", durationMinutes: 50, priceCents: 6500, enabled: true },
      { name: "Controllo", durationMinutes: 30, priceCents: 4500, enabled: true },
    ],
    faqs: [
      { question: "Serve una prescrizione?", answer: "Comunica la regola definita dal centro; per il caso specifico passa la richiesta allo staff." },
      { question: "Il trattamento va bene per il mio dolore?", answer: "Non valutare sintomi. Proponi una valutazione professionale." },
    ],
    rules: "Non interpretare sintomi né suggerire esercizi o trattamenti. Per dolore acuto, trauma o peggioramento coinvolgi subito una persona.",
  },
  {
    id: "wellness",
    label: "Spa e wellness",
    description: "Percorsi, massaggi, ingressi, pacchetti e buoni regalo.",
    services: [
      { name: "Massaggio relax", durationMinutes: 60, priceCents: 8500, enabled: true },
      { name: "Percorso spa", durationMinutes: 120, priceCents: 7000, enabled: true },
      { name: "Rituale di coppia", durationMinutes: 90, priceCents: 18000, enabled: true },
    ],
    faqs: [
      { question: "Posso acquistare un buono regalo?", answer: "Spiega le opzioni approvate e raccogli il recapito per l’invio." },
      { question: "Cosa devo portare?", answer: "Comunica soltanto le indicazioni pratiche approvate dalla struttura." },
    ],
    rules: "Non valutare controindicazioni personali. Per gravidanza, patologie o dubbi di salute coinvolgi lo staff.",
  },
  {
    id: "automotive",
    label: "Officina e servizi auto",
    description: "Tagliandi, gomme, revisioni, guasti e richieste di preventivo.",
    services: [
      { name: "Tagliando", durationMinutes: 120, priceCents: 0, enabled: true },
      { name: "Cambio gomme", durationMinutes: 60, priceCents: 0, enabled: true },
      { name: "Diagnosi guasto", durationMinutes: 60, priceCents: 0, enabled: true },
    ],
    faqs: [
      { question: "Quanto costa la riparazione?", answer: "Raccogli veicolo, targa e problema; non dare un prezzo senza una valutazione dell’officina." },
      { question: "Posso portare subito l’auto?", answer: "Verifica capacità e disponibilità prima di confermare l’accettazione." },
    ],
    rules: "Raccogli nome, telefono, targa, marca, modello, anno e descrizione del problema. Non diagnosticare guasti e non promettere tempi o preventivi non confermati.",
  },
  {
    id: "bakery",
    label: "Panetteria, pasticceria o gastronomia",
    description: "Ordini, prenotazioni, ritiro, quantità, ingredienti e disponibilità.",
    services: [
      { name: "Ordine da ritirare", durationMinutes: 15, priceCents: 0, enabled: true },
      { name: "Torta personalizzata", durationMinutes: 30, priceCents: 0, enabled: true },
      { name: "Vassoio per evento", durationMinutes: 30, priceCents: 0, enabled: true },
    ],
    faqs: [
      { question: "Avete prodotti senza glutine?", answer: "Comunica solo le informazioni approvate e, per allergie o contaminazioni, coinvolgi sempre una persona." },
      { question: "Posso ordinare per domani?", answer: "Raccogli prodotto, quantità, data, ora e recapito; conferma solo dopo aver verificato la disponibilità." },
    ],
    rules: "Raccogli prodotto, quantità, eventuale personalizzazione, data e ora di ritiro. Non garantire assenza di allergeni e non confermare ordini non verificati.",
  },
  {
    id: "restaurant",
    label: "Ristorante, bar o locale",
    description: "Prenotazioni tavoli, menu, orari, eventi e richieste da asporto.",
    services: [
      { name: "Prenotazione tavolo", durationMinutes: 120, priceCents: 0, enabled: true },
      { name: "Ordine da asporto", durationMinutes: 30, priceCents: 0, enabled: true },
      { name: "Richiesta evento", durationMinutes: 30, priceCents: 0, enabled: true },
    ],
    faqs: [
      { question: "Avete opzioni per allergie?", answer: "Descrivi solo le opzioni confermate; per allergie specifiche passa la chiamata al locale." },
      { question: "C’è posto stasera?", answer: "Chiedi numero di persone e orario, poi verifica la disponibilità reale." },
    ],
    rules: "Per i tavoli raccogli data, ora, numero di persone, nome e telefono. Non garantire gestione di allergie senza conferma umana.",
  },
  {
    id: "home_services",
    label: "Artigiano e servizi casa",
    description: "Idraulici, elettricisti, fabbri, caldaie, serramenti e manutenzioni.",
    services: [
      { name: "Sopralluogo", durationMinutes: 60, priceCents: 0, enabled: true },
      { name: "Manutenzione", durationMinutes: 90, priceCents: 0, enabled: true },
      { name: "Richiesta urgente", durationMinutes: 60, priceCents: 0, enabled: true },
    ],
    faqs: [
      { question: "Quanto costa l’uscita?", answer: "Comunica solo il diritto di chiamata approvato; il lavoro richiede una valutazione." },
      { question: "Potete venire subito?", answer: "Raccogli indirizzo, problema e situazione di sicurezza; verifica la reperibilità prima di promettere un intervento." },
    ],
    rules: "Raccogli nome, telefono, indirizzo, tipo di problema, urgenza e disponibilità. Per pericolo immediato invita a contattare i servizi di emergenza competenti; non dare istruzioni tecniche rischiose.",
  },
  {
    id: "retail",
    label: "Negozio e commercio",
    description: "Disponibilità prodotti, prenotazioni, ritiro, resi e richieste clienti.",
    services: [
      { name: "Ritiro prodotto", durationMinutes: 15, priceCents: 0, enabled: true },
      { name: "Consulenza in negozio", durationMinutes: 30, priceCents: 0, enabled: true },
      { name: "Assistenza ordine", durationMinutes: 20, priceCents: 0, enabled: true },
    ],
    faqs: [
      { question: "Il prodotto è disponibile?", answer: "Conferma soltanto dopo aver verificato l’inventario aggiornato." },
      { question: "Posso fare un reso?", answer: "Comunica la politica approvata e passa allo staff le eccezioni." },
    ],
    rules: "Non inventare disponibilità, tempi di consegna o sconti. Raccogli codice prodotto, quantità e recapito per le verifiche.",
  },
  {
    id: "professional",
    label: "Studio professionale",
    description: "Commercialisti, avvocati, consulenti, agenzie e amministratori.",
    services: [
      { name: "Primo colloquio", durationMinutes: 30, priceCents: 0, enabled: true },
      { name: "Appuntamento cliente", durationMinutes: 60, priceCents: 0, enabled: true },
      { name: "Richiesta di richiamata", durationMinutes: 15, priceCents: 0, enabled: true },
    ],
    faqs: [
      { question: "Potete darmi un parere?", answer: "Non fornire consulenza professionale. Raccogli il tema generale e proponi un appuntamento." },
      { question: "A che punto è la mia pratica?", answer: "Verifica l’identità e passa la richiesta al referente senza anticipare informazioni riservate." },
    ],
    rules: "Non fornire pareri legali, fiscali o finanziari. Raccogli solo il minimo necessario e proteggi ogni informazione riservata.",
  },
  {
    id: "real_estate",
    label: "Agenzia immobiliare",
    description: "Visite, richieste su immobili, proprietari e qualificazione dei contatti.",
    services: [
      { name: "Visita immobile", durationMinutes: 45, priceCents: 0, enabled: true },
      { name: "Valutazione immobile", durationMinutes: 60, priceCents: 0, enabled: true },
      { name: "Colloquio con agente", durationMinutes: 30, priceCents: 0, enabled: true },
    ],
    faqs: [
      { question: "L’immobile è ancora disponibile?", answer: "Verifica la scheda aggiornata prima di confermare." },
      { question: "Il prezzo è trattabile?", answer: "Non negoziare né fare promesse; registra la richiesta per l’agente." },
    ],
    rules: "Raccogli riferimento immobile, esigenza, zona, tempistica e recapito. Non promettere disponibilità, condizioni o accettazione di offerte.",
  },
  {
    id: "fitness",
    label: "Palestra e centro sportivo",
    description: "Prove, iscrizioni, corsi, personal trainer e recupero dei contatti.",
    services: [
      { name: "Prova gratuita", durationMinutes: 60, priceCents: 0, enabled: true },
      { name: "Colloquio iscrizione", durationMinutes: 30, priceCents: 0, enabled: true },
      { name: "Lezione individuale", durationMinutes: 60, priceCents: 5000, enabled: true },
    ],
    faqs: [
      { question: "Posso fare una prova?", answer: "Raccogli attività preferita, giorno, nome e recapito, poi verifica il posto disponibile." },
      { question: "Quale corso è adatto a me?", answer: "Descrivi i corsi approvati; per obiettivi o condizioni personali proponi un colloquio con un istruttore." },
    ],
    rules: "Non creare schede di allenamento e non valutare condizioni fisiche. Per salute, infortuni o idoneità coinvolgi un professionista.",
  },
  {
    id: "pet",
    label: "Veterinario e servizi animali",
    description: "Visite, toelettatura, pensione, richiami e richieste urgenti.",
    services: [
      { name: "Visita veterinaria", durationMinutes: 30, priceCents: 0, enabled: true },
      { name: "Toelettatura", durationMinutes: 90, priceCents: 0, enabled: true },
      { name: "Richiesta di richiamata", durationMinutes: 15, priceCents: 0, enabled: true },
    ],
    faqs: [
      { question: "Il mio animale sta male, cosa faccio?", answer: "Non dare indicazioni cliniche. Raccogli specie, sintomo generale e recapito e passa subito la richiesta alla struttura." },
      { question: "Quanto costa la visita?", answer: "Comunica solo la tariffa approvata e chiarisci che eventuali esami vengono valutati dal professionista." },
    ],
    rules: "Non fare diagnosi e non suggerire farmaci. Per difficoltà respiratoria, trauma, ingestione o peggioramento passa subito la chiamata allo staff.",
  },
  {
    id: "hospitality",
    label: "Hotel, B&B e strutture ricettive",
    description: "Disponibilità, richieste degli ospiti, check-in e servizi della struttura.",
    services: [
      { name: "Richiesta soggiorno", durationMinutes: 15, priceCents: 0, enabled: true },
      { name: "Check-in assistito", durationMinutes: 15, priceCents: 0, enabled: true },
      { name: "Richiesta evento", durationMinutes: 30, priceCents: 0, enabled: true },
    ],
    faqs: [
      { question: "Avete disponibilità?", answer: "Raccogli date, numero di ospiti e tipologia di camera; conferma solo dopo la verifica sul gestionale." },
      { question: "Posso arrivare tardi?", answer: "Comunica la procedura approvata e registra l'orario previsto senza promettere eccezioni." },
    ],
    rules: "Non inventare disponibilità, prezzi o servizi. Per reclami, sicurezza, accesso alla camera o eccezioni di pagamento coinvolgi una persona.",
  },
  {
    id: "education",
    label: "Scuola, corsi e autoscuola",
    description: "Lezioni di prova, iscrizioni, recuperi e informazioni sui corsi.",
    services: [
      { name: "Lezione di prova", durationMinutes: 60, priceCents: 0, enabled: true },
      { name: "Colloquio informativo", durationMinutes: 30, priceCents: 0, enabled: true },
      { name: "Lezione individuale", durationMinutes: 60, priceCents: 0, enabled: true },
    ],
    faqs: [
      { question: "Quando parte il prossimo corso?", answer: "Comunica solo il calendario approvato e raccogli il recapito per eventuali aggiornamenti." },
      { question: "Quanto costa l'iscrizione?", answer: "Spiega prezzi e condizioni approvati senza creare sconti o scadenze non confermate." },
    ],
    rules: "Per minori raccogli solo i dati indispensabili e coinvolgi il genitore o tutore. Non promettere risultati, certificazioni o date non confermate.",
  },
  {
    id: "general",
    label: "Altra attività",
    description: "Un modello neutro per professionisti e servizi su appuntamento.",
    services: [{ name: "Appuntamento", durationMinutes: 60, priceCents: 0, enabled: true }],
    faqs: [{ question: "Come posso prenotare?", answer: "Raccogli la richiesta, proponi le disponibilità e chiedi conferma prima di fissare." }],
    rules: "Se la richiesta è delicata, urgente, economica o non prevista, non improvvisare e coinvolgi una persona.",
  },
];

export function getVoiceCategory(id: string) {
  return voiceCategories.find((category) => category.id === id) || voiceCategories[0];
}
