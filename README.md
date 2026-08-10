# AgendaPiena AI

Piattaforma Next.js per recuperare clienti, riempire disponibilità e preparare messaggi WhatsApp controllati per attività che lavorano su appuntamento.

## Funzioni incluse

- sito commerciale multipagina con SEO, GEO, sitemap e dati strutturati;
- acquisizione lead collegata a PostgreSQL;
- accesso amministratore con sessione firmata e cookie HTTP-only;
- dashboard mobile con priorità, valore stimato e bozze approvabili;
- motore deterministico di ottimizzazione con consenso e opt-out;
- generazione messaggi tramite OpenAI Responses API con fallback locale;
- invio e webhook WhatsApp Cloud API;
- checkout e webhook Stripe;
- cron Vercel giornaliero per creare nuove opportunità;
- schema PostgreSQL e migrazioni Drizzle compatibili con Supabase e Neon.

## Avvio locale

Richiede Node.js 22 o superiore.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Senza variabili esterne l'app parte in modalità dimostrativa. L'accesso locale predefinito è documentato nella pagina `/accesso` e viene disabilitato in produzione se `ADMIN_PASSWORD` non è configurata.

## Database Supabase o Neon

1. Crea un database PostgreSQL.
2. Inserisci la connection string pooled in `DATABASE_URL`.
3. Applica le migrazioni con `npm run db:push` oppure esegui i file in `drizzle/`.
4. Esegui `npm run db:seed` per creare il primo centro e i dati di verifica.
5. Imposta le stesse variabili nel progetto Vercel.

Lo schema è multi-organizzazione e comprende: organizzazioni, membri, clienti, appuntamenti, opportunità, messaggi, lead, integrazioni, abbonamenti e audit log.

## Distribuzione Vercel

Collega la repository a Vercel, imposta le variabili elencate in `.env.example` e usa i comandi standard Next.js. `vercel.json` configura l'ottimizzazione quotidiana alle 06:00 UTC.

Prima del go-live configura un dominio reale, completa privacy e termini con i dati societari e registra su Meta gli URL del webhook WhatsApp.

## Controlli

```bash
npm run lint
npm test
npm run build
```

La documentazione dell'API OpenAI usata per le bozze è la [Responses API ufficiale](https://platform.openai.com/docs/api-reference/responses).
