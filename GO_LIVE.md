# Go-live AgendaPiena AI su Render e Neon

## 1. Neon

1. Crea il progetto `agendapiena-ai` in una regione europea.
2. Copia la connection string con pooling in `DATABASE_URL`.
3. Copia la connection string diretta in `DIRECT_DATABASE_URL` per le migrazioni.
4. In locale esegui `npm run db:push` e `npm run db:seed` usando le variabili Neon.

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
