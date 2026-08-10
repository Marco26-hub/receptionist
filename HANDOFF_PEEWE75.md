# Handoff per peewe75

## Stato

AgendaPiena AI è stato migrato da uno starter Cloudflare/vinext a Next.js 16 standard, pronto per Vercel. Il backend funziona in modalità demo senza servizi esterni e passa automaticamente alla modalità live quando viene configurato PostgreSQL.

Commit principale: `9087938` (`Build production SaaS backend and luxury experience`).

## Prodotto

AgendaPiena individua opportunità per attività che lavorano su appuntamento:

- centri estetici;
- parrucchieri e barberie;
- cliniche estetiche e longevità;
- studi dentistici;
- fisioterapia e osteopatia;
- spa e centri wellness.

Workflow:

1. importa clienti e agenda;
2. verifica consenso e opt-out;
3. individua clienti inattivi, spazi liberi e percorsi interrotti;
4. calcola un punteggio spiegabile;
5. genera una bozza WhatsApp;
6. richiede approvazione umana;
7. approva e invia tramite Meta WhatsApp Cloud API;
8. registra consegna, lettura e risposta;
9. collega la risposta all’appuntamento;
10. registra il valore recuperato e aggiorna le regole.

## Architettura

- Frontend e API: Next.js App Router.
- Deploy previsto: Vercel.
- Database: PostgreSQL con Drizzle, compatibile Supabase o Neon.
- AI: OpenAI Responses API con fallback locale sicuro.
- Messaggi: Meta WhatsApp Cloud API e webhook firmato.
- Pagamenti: Stripe Checkout e webhook firmato.
- Automazione: Vercel Cron alle 06:00 UTC.
- Autenticazione MVP: sessione HMAC in cookie HTTP-only con credenziali da environment.

## File chiave

- `db/schema.ts`: schema multi-organizzazione.
- `drizzle/`: migrazioni PostgreSQL.
- `app/lib/optimization.ts`: algoritmo di priorità.
- `app/lib/repository.ts`: accesso dati e workflow.
- `app/lib/ai.ts`: generazione bozze.
- `app/lib/whatsapp.ts`: invio WhatsApp.
- `app/components/AdminDashboard.tsx`: area operativa.
- `app/api/`: endpoint applicativi e webhook.
- `.env.example`: variabili richieste.
- `scripts/seed.mjs`: inizializzazione del primo centro.

## Avvio

```bash
npm install
cp .env.example .env.local
npm run dev
```

Senza chiavi esterne:

- URL: `http://localhost:3000`
- Admin: `http://localhost:3000/accesso`
- Email demo: `demo@agendapiena.ai`
- Password demo: `AgendaPienaDemo2026!`

La password demo non è disponibile in produzione se `ADMIN_PASSWORD` non viene configurata.

## Collegamento Supabase

1. Creare un progetto Supabase.
2. Copiare la connection string del pooler in `DATABASE_URL`.
3. Eseguire `npm run db:push`.
4. Eseguire `npm run db:seed`.
5. Configurare tutte le variabili di `.env.example` in Vercel.

## Verifiche completate

- `npm run lint`: superato.
- `npm test`: superato.
- `npm run build`: superato, 43 route generate.
- `npm audit --omit=dev`: 0 vulnerabilità di produzione.
- login demo: verificato.
- acquisizione lead: verificata.
- generazione bozza fallback: verificata.
- cron ottimizzazione: verificato.
- approvazione e invio demo: verificati.

## Prima del go-live

- Inserire dati societari reali in Privacy e Termini.
- Configurare dominio ed email reali.
- Collegare Supabase e applicare le migrazioni.
- Configurare OpenAI, WhatsApp e Stripe.
- Registrare URL webhook nel pannello Meta e Stripe.
- Sostituire l’autenticazione MVP con Supabase Auth se servono più utenti, inviti e recupero password.
- Fare un test con un numero WhatsApp sandbox prima di contattare clienti reali.

Non rimuovere il controllo umano o i controlli `marketingConsent` e `doNotContact`: sono vincoli fondamentali del prodotto.
