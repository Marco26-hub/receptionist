# Controllo go-live AgendaPiena AI

Aggiornato: 11 agosto 2026

## Bloccanti prima della vendita

- Sostituire la password amministratore temporanea con una password lunga e unica.
- Configurare Supabase Auth per gli account dei clienti e verificare separazione tra organizzazioni.
- Collegare un monitor esterno a `/api/health?deep=1` e configurare `SENTRY_DSN` oppure `HEALTHCHECK_MONITOR_URL`.
- Attivare e provare il ripristino del database Neon. Impostare `BACKUP_POLICY_CONFIRMED=true` solo dopo una prova documentata.
- Firmare DPA, elenco subfornitori e tempi di conservazione per clienti, chiamate, trascrizioni, audio e documenti.
- Collegare e provare separatamente Retell, OpenRouter/OpenAI, Meta WhatsApp e Stripe per i servizi realmente venduti.

## Privacy e registrazioni

- Audio disattivato per impostazione iniziale.
- Se l'audio viene attivato, l'assistente deve avvisare subito e gestire il mancato consenso.
- Vietare nel caricamento documenti dati sanitari o dati cliente non necessari.
- Definire cancellazione automatica e accessi autorizzati prima di conservare audio reali.

## Sicurezza

- HTTPS, HSTS, anti-frame, no-sniff, referrer policy e isolamento cross-origin configurati.
- Microfono consentito soltanto alla stessa origine per la prova Voice autenticata.
- Webhook firmati e download registrazioni protetti da sessione e organizzazione.
- Da aggiungere prima di campagne pubbliche: rate limit condiviso per login, lead e checkout.

## Controlli operativi

1. Verificare `/api/health?deep=1`; usare la sezione `readiness` del servizio venduto.
2. Eseguire `npm ci`, `npm run lint` e `npm test` sul commit da pubblicare.
3. Provare login, logout, recupero accesso, separazione tra due clienti e scadenza sessione.
4. Provare chiamata italiana e inglese, prenotazione, modifica, annullamento, trasferimento e rifiuto registrazione.
5. Provare checkout, rinnovo, pagamento fallito, fattura, upgrade, downgrade e cancellazione.
6. Controllare home, prezzi, contatti, accesso e admin a 360x800, 768x1024 e 1440x900.
7. Controllare `robots.txt`, `sitemap.xml`, canonical, dati strutturati e pagine escluse dall'indice.

## Decisione

Il sito pubblico può essere mostrato. Il prodotto non va dichiarato completamente operativo finché il modulo venduto non risulta `true` in `readiness` e non supera un test reale dall'inizio alla fine.
