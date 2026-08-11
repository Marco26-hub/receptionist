# AgendaPiena AI

Piattaforma Next.js per recuperare clienti, riempire disponibilità e preparare messaggi WhatsApp controllati per attività che lavorano su appuntamento.

## Funzioni incluse

- sito commerciale multipagina con SEO, GEO, sitemap e dati strutturati;
- acquisizione lead collegata a PostgreSQL;
- accesso amministratore con sessione firmata e cookie HTTP-only;
- autenticazione multi-cliente tramite Supabase Auth, con fallback locale controllato;
- dashboard mobile con priorità, valore stimato e bozze approvabili;
- motore deterministico di ottimizzazione con consenso e opt-out;
- generazione messaggi tramite OpenAI Responses API con fallback locale;
- invio e webhook WhatsApp Cloud API;
- checkout e webhook Stripe;
- cron Vercel giornaliero per creare nuove opportunità;
- inserimento manuale e importazione CSV di clienti;
- agenda operativa, rilevazione degli spazi liberi e follow-up post visita;
- tracciamento consegna, risposta e prenotazione recuperata;
- impostazioni per orari, durata degli slot, tono e valore medio;
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

Per più clienti, abilita Supabase Auth, crea o invita l'utente e usa la stessa email nella tabella `members`. `ADMIN_EMAIL` e `ADMIN_PASSWORD` restano un accesso operativo a singolo cliente; la password demo è disponibile esclusivamente in sviluppo.

Lo schema è multi-organizzazione e comprende: organizzazioni, membri, clienti, appuntamenti, opportunità, messaggi, lead, integrazioni, abbonamenti e audit log.

## Distribuzione Vercel

Collega la repository a Vercel, imposta le variabili elencate in `.env.example` e usa i comandi standard Next.js. `vercel.json` configura l'ottimizzazione quotidiana alle 06:00 UTC.

Prima del go-live configura un dominio reale, completa privacy e termini con i dati societari e registra su Meta gli URL del webhook WhatsApp.

### Ciclo operativo

1. Importa i clienti da `/admin/clienti` e registra soltanto consensi documentati.
2. Inserisci o collega gli appuntamenti in `/admin/agenda`.
3. Configura orari e integrazioni in `/admin/impostazioni`.
4. Esegui `Analizza ora` oppure attendi il cron quotidiano.
5. Controlla e modifica la bozza, quindi approva l'invio.
6. Il webhook aggiorna invio, consegna, lettura e risposta.
7. Quando arriva una prenotazione, usa `Segna prenotato` per misurare la conversione.

Per contatti WhatsApp avviati dall'azienda è necessario configurare in Meta un template approvato con un parametro nel corpo e indicarlo in `WHATSAPP_TEMPLATE_NAME`. Le bozze OpenAI sono disattivate per impostazione predefinita: si attivano esplicitamente con `AI_DRAFTS_ENABLED=true` dopo aver definito le basi giuridiche e gli accordi sul trattamento dei dati.

Il deploy è considerato pronto dal controllo `GET /api/health?deep=1` solo quando database, sessione, WhatsApp e cron risultano configurati. Stripe è mostrato separatamente perché il modello commerciale attuale parte da una demo e da un'attivazione assistita.

## Controlli

```bash
npm run lint
npm test
npm run build
npm run check:env
```

La procedura completa di pubblicazione è in [`GO_LIVE.md`](./GO_LIVE.md).

La documentazione dell'API OpenAI usata per le bozze è la [Responses API ufficiale](https://platform.openai.com/docs/api-reference/responses).
