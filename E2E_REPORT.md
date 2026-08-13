# Collaudo E2E AgendaPiena AI

**Data:** 13 agosto 2026  
**Ambienti:** database collegato in modalità test e ambiente dimostrativo isolato

## Ciclo assistente telefonico

- Accesso amministratore: superato.
- Presentazione come assistente virtuale: superato.
- Richiesta di un nuovo appuntamento: superato.
- Chiamante in inglese: superato.
- Spostamento appuntamento con verifica identità: superato.
- Annullamento con conferma: superato.
- Domanda delicata senza consiglio clinico: superato.
- Richiesta non prevista e passaggio allo staff: superato.
- Controllo della disponibilità: superato.
- Protezione delle API Retell mediante firma: superato.
- Conferma prenotazione in modalità test: superato, nessun appuntamento reale creato.

## Ciclo recupero cliente

- Apertura della landing su smartphone: superato.
- Accesso all'area amministrativa: superato.
- Selezione dell'opportunità: superato.
- Preparazione del messaggio con fallback locale dichiarato: superato.
- Approvazione e invio dimostrativo: superato, nessun destinatario reale contattato.
- Consultazione del registro messaggi: superato.

## Problemi trovati e corretti

- Le azioni locali erano bloccate quando il dominio pubblico era configurato: il controllo consente ora `localhost` soltanto in sviluppo e resta rigido in produzione.
- I fallback tecnici non erano raccolti in un punto visibile: ora l'admin mostra lo stato reale di database, AI, Retell, WhatsApp e Stripe.
- WhatsApp senza Meta poteva sembrare inviato: in produzione l'invio viene ora bloccato con un errore esplicito.
- Le simulazioni voce e le bozze indicano ora se usano AI oppure il modello locale di sicurezza.

## Test esterni ancora necessari

Il ciclo con chiamata, messaggio e pagamento reali richiede le chiavi di produzione Retell, OpenAI/OpenRouter, Meta WhatsApp e Stripe. Dopo il collegamento vanno ripetuti gli stessi casi usando numeri e carte di prova autorizzati.
