# Go-live AgendaPiena AI

## 1. Infrastruttura

1. Crea il progetto Supabase nella regione europea scelta.
2. Inserisci la connection string pooler in `DATABASE_URL`.
3. Esegui `npm run db:push` e `npm run db:seed`.
4. Crea in Supabase Auth l'utente del centro con la stessa email inserita in `members`.
5. Collega la repository a Vercel e configura tutte le variabili di `.env.example`.
6. Esegui `npm run check:env` nel contesto delle variabili di produzione.

## 2. WhatsApp

1. Configura Meta WhatsApp Cloud API e un numero mittente reale.
2. Fai approvare un template in italiano con un parametro nel corpo (`{{1}}`).
3. Imposta `WHATSAPP_TEMPLATE_NAME` e `WHATSAPP_TEMPLATE_LANGUAGE`.
4. Registra `https://DOMINIO/api/webhooks/whatsapp` come webhook.
5. Usa `WHATSAPP_VERIFY_TOKEN` per la verifica e abilita l'evento `messages`.
6. Prova invio, consegna, lettura, risposta e opt-out con numeri autorizzati.

## 3. Dati e AI

1. Importa un campione da `/admin/clienti` e verifica formati, duplicati e consensi.
2. Carica appuntamenti passati e futuri da `/admin/agenda`.
3. Configura orari e durata degli slot in `/admin/impostazioni`.
4. Lascia `AI_DRAFTS_ENABLED=false` finché ruoli privacy, DPA e policy interne non sono approvati.
5. Non inserire diagnosi o dati sanitari non necessari nei campi inviati al modello.

## 4. Aspetti commerciali e legali

1. Inserisci ragione sociale, partita IVA, indirizzo ed email nelle variabili `LEGAL_*`.
2. Fai verificare Privacy, Termini, DPA, base giuridica dei messaggi e tempi di conservazione da un professionista.
3. Configura Stripe soltanto se si attiva il pagamento self-service; il funnel attuale prevede demo e attivazione assistita.

## 5. Collaudo finale

1. Apri `https://DOMINIO/api/health?deep=1`: deve rispondere `ready` con HTTP 200.
2. Verifica login di due organizzazioni e assenza di dati incrociati.
3. Esegui l'intero ciclo: importazione, analisi, modifica bozza, approvazione, invio, risposta e conversione.
4. Controlla il cron Vercel e gli audit log dopo l'esecuzione delle 06:00 UTC.
5. Esegui `npm run lint`, `npm test` e un backup/ripristino del database.
