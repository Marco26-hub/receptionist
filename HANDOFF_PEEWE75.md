# Handoff per peewe75

Aggiornato: 11 agosto 2026

## Stato attuale

AgendaPiena AI è online su Render:

- sito: `https://agendapiena-ai.onrender.com`;
- repository: `https://github.com/Marco26-hub/receptionist.git`;
- branch: `main`;
- ultimo commit consegnato: `029509d` (`Harden voice appointment lifecycle`);
- database: Neon PostgreSQL collegato e migrazioni applicate;
- admin: `https://agendapiena-ai.onrender.com/accesso`;
- pannello Voice: `https://agendapiena-ai.onrender.com/admin/voce`.

Il sito, il database, l’accesso amministratore e la modalità di prova funzionano. Le chiamate reali, WhatsApp e i pagamenti non sono ancora attivi perché mancano le rispettive chiavi di produzione.

Non inserire password o chiavi API in questo file o nel repository. La password amministratore temporanea è configurata solo su Render e deve essere sostituita prima della vendita.

## Prodotto

AgendaPiena AI offre due servizi collegabili:

1. **Agenda e clienti**: analizza clienti e appuntamenti, individua spazi liberi e clienti da recuperare, prepara messaggi WhatsApp e richiede sempre l’approvazione umana.
2. **Segretaria telefonica AI**: risponde alle chiamate, si presenta come assistente virtuale, informa sui servizi approvati, gestisce appuntamenti e passa la chiamata allo staff quando serve.

I settori includono estetica, parrucchieri, cliniche, dentisti, fisioterapia, wellness, officine, ristorazione, artigiani, negozi, studi professionali, immobiliari, palestre, veterinari, hotel e scuole.

## Ciclo Voice

Il flusso implementato è:

1. il cliente chiama il numero collegato a Retell;
2. l’assistente dice il nome dell’attività e dichiara di essere un assistente virtuale;
3. riconosce italiano o inglese e prosegue nella lingua del cliente;
4. usa soltanto servizi, prezzi, FAQ e regole approvati nell’admin;
5. per una nuova prenotazione controlla prima gli orari realmente disponibili;
6. raccoglie nome e telefono;
7. ripete servizio, giorno e ora e chiede conferma esplicita;
8. salva l’appuntamento solo se lo slot è ancora libero;
9. per spostare o annullare cerca prima la prenotazione verificando nome e telefono;
10. non dichiara mai un’azione conclusa prima dell’esito positivo dello strumento;
11. per richieste cliniche, reclami, urgenze o casi non previsti coinvolge lo staff;
12. webhook, trascrizione, riepilogo, esito e costo vengono registrati nel database.

Protezione aggiunta: indice univoco Neon `appointments_org_external_idx` e inserimento idempotente per impedire doppie prenotazioni della stessa chiamata.

## Admin Voice

Il cliente può:

- scegliere un modello per categoria;
- aggiungere, modificare e cancellare fino a 50 servizi;
- impostare durata e prezzo di ogni servizio;
- aggiungere FAQ e risposte approvate;
- scegliere italiano, inglese o riconoscimento automatico;
- personalizzare nome, saluto e tono;
- impostare il numero dello staff;
- attivare o disattivare prenotazioni e registrazione audio;
- generare saluto, istruzioni e FAQ con GPT-5 mini;
- provare scenari scritti e scaricare il risultato;
- avviare una chiamata vocale web quando Retell è collegato;
- leggere chiamate, trascrizioni ed esiti;
- mettere in pausa l’assistente.

Il modello “Centro estetico” contiene ora esempi modificabili: pulizia viso, trattamento viso avanzato, trattamento corpo, massaggio, epilazione, manicure, pedicure e consulenza iniziale. Non sono limiti del sistema.

Prima dell’attivazione devono essere superate cinque prove essenziali: presentazione, nuova prenotazione, spostamento, annullamento e domanda delicata.

## Architettura

- Frontend e backend: Next.js 16 App Router.
- Hosting corrente: Render Web Service.
- Database: Neon PostgreSQL con Drizzle ORM.
- Motore vocale previsto: Retell AI.
- Modello di preparazione: GPT-5 mini tramite OpenRouter, con fallback OpenAI o modello locale prudente.
- Messaggi: Meta WhatsApp Cloud API.
- Pagamenti: Stripe Checkout e webhook.
- Autenticazione: accesso amministratore da variabili Render; Supabase Auth è supportato ma non configurato.
- Sessione: cookie HTTP-only firmato HMAC.
- Automazione: endpoint cron e GitHub Actions.
- Readiness: `npm run check:env` e `GET /api/health?deep=1`.

## File Voice principali

- `app/components/VoiceAdmin.tsx`: pannello semplice per il cliente.
- `app/lib/voice-categories.ts`: modelli per categoria.
- `app/lib/voice-ai.ts`: GPT-5 mini, simulazioni e controlli.
- `app/lib/retell.ts`: configurazione Retell, strumenti e pubblicazione.
- `app/lib/voice-repository.ts`: persistenza, disponibilità e ciclo appuntamenti.
- `app/api/voice/tools/availability/route.ts`: controllo disponibilità.
- `app/api/voice/tools/booking/route.ts`: nuova prenotazione.
- `app/api/voice/tools/appointments/find/route.ts`: ricerca prenotazioni.
- `app/api/voice/tools/appointments/reschedule/route.ts`: spostamento.
- `app/api/voice/tools/appointments/cancel/route.ts`: annullamento.
- `app/api/webhooks/retell/route.ts`: eventi e analisi chiamate.
- `drizzle/0004_big_lightspeed.sql`: vincolo anti-duplicazione.

## Cosa manca per Retell reale

1. Creare o usare un account Retell.
2. Creare un agente con motore Retell LLM.
3. Acquistare o importare un numero telefonico.
4. Inserire `RETELL_API_KEY` su Render.
5. Inserire nell’admin il codice agente Retell, il numero collegato e il numero dello staff.
6. Configurare una voce italiana e il modello `gpt-5-mini`.
7. Salvare, completare tutte le prove essenziali e segnare l’assistente come pronto.
8. Attivare il numero e fare chiamate controllate in italiano e inglese.
9. Verificare webhook, prenotazione, spostamento, annullamento e trasferimento umano.

Senza `RETELL_API_KEY` il pannello mostra correttamente la modalità di prova, ma non può parlare con un cliente reale.

## Variabili ancora mancanti su Render

- `RETELL_API_KEY`: chiamate reali;
- `OPENROUTER_API_KEY`: generazione GPT-5 mini;
- credenziali Meta WhatsApp: invio reale;
- credenziali Stripe: abbonamenti e pagamenti.

L’endpoint salute è quindi `degraded` finché questi servizi non vengono collegati. Non dichiarare il prodotto completamente in go-live prima di una risposta `ready` e di un test reale dall’inizio alla fine.

## Prezzi pubblicati

- Agenda e clienti: €390/mese, avvio €790.
- Tutto in uno: €569/mese, avvio da €1.190, 300 minuti Voice.
- Voce Base: €199/mese, avvio €590, 300 minuti.
- Voce Attività: €349/mese, avvio €790, 700 minuti.
- Voce Azienda: €649/mese, avvio da €990, 1.500 minuti.

La pagina `/prezzi` spiega volumi, costi oltre soglia, esclusioni e condizioni di aumento o riduzione del piano.

## Verifiche completate

- build Next.js di produzione: superata;
- TypeScript: superato;
- ESLint: superato;
- 11 test di produzione: superati;
- 61 route generate, incluse le tre nuove azioni appuntamento;
- database Neon raggiungibile;
- migrazione anti-duplicazione applicata e verificata;
- login amministratore verificato in produzione;
- pagina prezzi verificata su desktop e mobile;
- pannello Voice verificato in produzione;
- repository pulito dopo il commit `029509d`.

## Regole da non rimuovere

- approvazione umana per WhatsApp;
- controlli `marketingConsent` e `doNotContact`;
- firma dei webhook Retell, Meta e Stripe;
- verifica organizzazione su ogni query;
- conferma esplicita prima di creare, spostare o annullare;
- controllo disponibilità immediatamente prima del salvataggio;
- identificazione tramite nome e telefono per gestire appuntamenti esistenti;
- nessuna diagnosi, promessa, sconto o risposta inventata;
- passaggio allo staff in caso di dubbio.

## Prossima attività consigliata

Collegare Retell in ambiente di produzione e completare una matrice di chiamate reali: italiano, inglese, rumore, interruzioni, servizio inesistente, slot appena occupato, doppio invio, spostamento, annullamento, richiesta clinica e trasferimento allo staff. Solo dopo questo test attivare il primo cliente pagante.
