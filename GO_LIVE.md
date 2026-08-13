# Go-live AgendaPiena AI su Render e Neon

## 1. Neon

1. Crea il progetto `agendapiena-ai` in una regione europea.
2. Copia la connection string con pooling in `DATABASE_URL`.
3. Copia la connection string diretta in `DIRECT_DATABASE_URL` per le migrazioni.
4. In locale esegui `npm run db:push` e `npm run db:seed` usando le variabili Neon. Lascia `SEED_DEMO_DATA=false` sul database reale.

L'app usa la connessione pooled durante il normale funzionamento. Drizzle usa quella diretta per le modifiche allo schema.

## 2. Render

1. Nel Dashboard scegli `New` e poi `Blueprint`.
2. Collega `Marco26-hub/receptionist`: Render troverà `render.yaml`.
3. Crea il Web Service gratuito in regione Frankfurt.
4. Inserisci `DATABASE_URL` da Neon e le variabili richieste dal Blueprint.
5. Dopo il primo deploy imposta `NEXT_PUBLIC_SITE_URL` con l'URL `onrender.com` reale e ridistribuisci.

Il Blueprint usa `npm ci && npm run build`, `npm start`, Node 22 e auto-deploy dal branch `main`.

## 3. Automazione quotidiana

Render non offre Cron Job nel piano gratuito. Il workflow `.github/workflows/daily-optimization.yml` chiama l'app ogni giorno alle 06:00 UTC.

Configura nella repository GitHub:

- secret `APP_URL`: URL pubblico Render senza slash finale;
- secret `CRON_SECRET`: lo stesso valore configurato su Render.

## 4. WhatsApp e AI

1. Configura Meta WhatsApp Cloud API e un numero mittente reale.
2. Fai approvare un template in italiano con un parametro nel corpo (`{{1}}`).
3. Registra `https://DOMINIO/api/webhooks/whatsapp` e abilita l'evento `messages`.
4. Prova invio, consegna, lettura, risposta e opt-out con numeri autorizzati.
5. Lascia `AI_DRAFTS_ENABLED=false` finché ruoli privacy, DPA e policy interne non sono approvati.

## 5. Collaudo finale

1. Esegui `npm run check:env` nel contesto delle variabili di produzione.
2. Apri `https://DOMINIO/api/health?deep=1`: deve rispondere `ready` con HTTP 200.
3. Esegui l'intero ciclo: importazione, analisi, modifica bozza, approvazione, invio, risposta e conversione.
4. Controlla il workflow GitHub Actions e gli audit log.
5. Fai verificare Privacy, Termini, DPA, base giuridica dei messaggi e conservazione dei dati.

## 5.1 Calendario Cal.com

1. Imposta su Render `INTEGRATION_ENCRYPTION_KEY` con almeno 32 caratteri casuali e non cambiarla dopo aver collegato i calendari.
2. Crea su Cal.com un tipo di appuntamento telefonico: nome e telefono obbligatori, email facoltativa, calendario Google o Outlook collegato.
3. Crea una chiave in `Cal.com > Impostazioni > Sviluppatori > Chiavi API`.
4. Nell’admin AgendaPiena apri `Impostazioni`, inserisci chiave e ID del tipo di appuntamento, quindi premi `Verifica e collega`.
5. Prova disponibilità, prenotazione, spostamento e annullamento. Controlla sia AgendaPiena sia il calendario finale.
6. Simula una chiave revocata: l’assistente non deve confermare l’operazione e l’errore deve comparire nell’admin.

## 6. Assistente vocale

1. Crea in Retell un assistente con motore Retell LLM e una voce compatibile con le lingue scelte.
2. Inserisci su Render `RETELL_API_KEY` e, per la preparazione AI, `OPENROUTER_API_KEY` oppure `OPENAI_API_KEY`.
3. Nell’admin apri `Voce`, inserisci codice assistente, codice voce e numero Retell in formato internazionale (`+39...`).
4. Scegli italiano, inglese o riconoscimento automatico italiano/inglese. In automatico l’assistente risponde nella lingua usata da chi chiama; per la massima precisione usa una lingua singola quando possibile.
5. Salva, esegui almeno una prova, segna l’assistente come pronta e solo dopo attiva il numero.
6. Verifica una chiamata reale completa: risposta, disponibilità, conferma appuntamento, trasferimento allo staff, webhook e registro chiamate.
7. Premi `Metti in pausa` e chiama di nuovo il numero: Retell non deve più inoltrare le chiamate all’assistente.

La registrazione è disattivata di base. Prima di abilitarla vanno definiti informativa, consenso, accessi e tempi di conservazione.

## 7. Pagamenti Stripe

1. In Stripe crea i cinque prezzi mensili e i relativi prezzi una tantum di avvio, tutti in euro e IVA esclusa.
2. Inserisci su Render `STRIPE_SECRET_KEY`, i codici `STRIPE_PRICE_*` e `STRIPE_WEBHOOK_SECRET`. Usa prima le chiavi test `sk_test_...`.
3. Registra il webhook `https://DOMINIO/api/webhooks/stripe` e abilita `checkout.session.completed`, `checkout.session.async_payment_succeeded` e tutti gli eventi `customer.subscription.*`.
4. Attiva il Portale cliente Stripe e abilita aggiornamento carta, fatture, cambio piano e disdetta. Se usi una configurazione specifica, inserisci `STRIPE_PORTAL_CONFIGURATION_ID`.
5. Dall’area `Piano e pagamenti` prova checkout, annullamento, pagamento riuscito, rinnovo, carta rifiutata, upgrade, downgrade e disdetta.
6. Verifica nel database che cliente Stripe, abbonamento, piano, importo, stato e data di rinnovo appartengano all’azienda corretta.
