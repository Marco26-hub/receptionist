"use client";

import { useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Bot,
  Check,
  ChevronDown,
  CircleStop,
  Clock3,
  Download,
  Eye,
  ListChecks,
  LoaderCircle,
  Mic,
  Pause,
  PhoneCall,
  Play,
  Plus,
  Rocket,
  Save,
  Settings2,
  Sparkles,
  Trash2,
  Volume2,
} from "lucide-react";
import { voiceGreeting } from "../lib/voice-language";
import type { VoiceFaq, VoiceService, VoiceTranscriptTurn } from "../../db/schema";
import type { VoiceCategory } from "../lib/voice-categories";

type Agent = {
  id: string;
  name: string;
  category: string;
  language: string;
  status: "draft" | "testing" | "ready" | "live" | "paused";
  model: string;
  voiceId: string;
  greeting: string;
  systemPrompt: string;
  services: VoiceService[];
  faqs: VoiceFaq[];
  transferNumber: string | null;
  bookingEnabled: boolean;
  recordingEnabled: boolean;
  testMode: boolean;
  retellAgentId: string | null;
  retellPhoneNumber: string | null;
  publishedVersion: number;
  lastTestedAt: Date | null;
};

type VoiceCall = {
  id: string;
  status: string;
  mode: string;
  direction: string;
  fromNumber: string | null;
  durationSeconds: number;
  costCents: number;
  summary: string | null;
  outcome: string | null;
  transcript: VoiceTranscriptTurn[];
  hasRecording?: boolean;
  createdAt: Date;
};

type TestRun = { id: string; scenario: string; status: string; input: string; output: string; checks: Array<{ label: string; passed: boolean }>; createdAt: Date };
type Scenario = { id: string; title: string; prompt: string; expected: string };
type Tab = "prepare" | "test" | "calls";

type Props = {
  initialData: {
    businessName: string;
    agent: Agent;
    calls: VoiceCall[];
    tests: TestRun[];
    scenarios: Scenario[];
    requiredScenarioIds: string[];
    integrations: { retell: boolean; ai: boolean; openrouter: boolean };
    mode: "demo" | "live";
  };
  categories: VoiceCategory[];
};

const statusText = { draft: "Da preparare", testing: "In prova", ready: "Pronta", live: "Attiva", paused: "In pausa" };

export function VoiceAdmin({ initialData, categories }: Props) {
  const [agent, setAgent] = useState(initialData.agent);
  const [tab, setTab] = useState<Tab>("prepare");
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedScenario, setSelectedScenario] = useState(initialData.scenarios[0]);
  const [testPrompt, setTestPrompt] = useState(initialData.scenarios[0]?.prompt || "");
  const [testResult, setTestResult] = useState<{ output: string; checks: Array<{ label: string; passed: boolean }>; provider: string } | null>(null);
  const [callActive, setCallActive] = useState(false);
  const callClient = useRef<{ stopCall: () => void } | null>(null);
  const currentCategory = useMemo(() => categories.find((item) => item.id === agent.category) || categories[0], [agent.category, categories]);
  const passedScenarios = new Set(initialData.tests.filter((test) => test.status === "passed").map((test) => test.scenario));
  if (testResult?.checks.every((check) => check.passed)) passedScenarios.add(selectedScenario.id);
  const passedRequiredTests = initialData.requiredScenarioIds.filter((scenario) => passedScenarios.has(scenario)).length;
  const hasPassedTest = passedRequiredTests === initialData.requiredScenarioIds.length;
  const retellConnected = initialData.integrations.retell && Boolean(agent.retellAgentId);
  const phoneReady = retellConnected && Boolean(agent.retellPhoneNumber);

  function updateAgent<K extends keyof Agent>(key: K, value: Agent[K]) { setAgent((current) => ({ ...current, [key]: value })); }

  function changeLanguage(language: string) {
    const businessName = initialData.businessName;
    setAgent((current) => ({
      ...current,
      language,
      greeting: voiceGreeting(language, businessName),
    }));
    setNotice(language.includes(",") ? "Riconoscimento automatico attivo: saluta in italiano, poi continua solo nella lingua usata dalla persona." : "Lingua aggiornata. Controlla il saluto prima di salvare.");
  }

  function chooseScenario(scenario: Scenario) {
    setSelectedScenario(scenario);
    setTestPrompt(scenario.prompt);
    setTestResult(null);
    if (scenario.id === "booking_en" && agent.language === "it-IT") setNotice("Per provare l’inglese scegli English o Riconoscimento automatico nel simulatore.");
  }

  function loadCategory() {
    setAgent((current) => ({
      ...current,
      services: currentCategory.services.map((service) => ({ ...service })),
      faqs: currentCategory.faqs.map((faq) => ({ ...faq })),
      systemPrompt: `${current.systemPrompt.split("\n\nREGOLE DEL SETTORE")[0]}\n\nREGOLE DEL SETTORE\n${currentCategory.rules}`,
    }));
    setNotice(`Modello “${currentCategory.label}” caricato. Puoi modificarlo prima di salvare.`);
  }

  async function api(path: string, body?: Record<string, unknown>) {
    const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body || {}) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Operazione non riuscita");
    return result;
  }

  async function save() {
    setBusy("save"); setNotice("");
    try {
      const result = await api("/api/admin/voice/agent", agent as unknown as Record<string, unknown>);
      setAgent(result.agent); setNotice("Configurazione salvata.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Non siamo riusciti a salvare"); }
    finally { setBusy(""); }
  }

  async function generate() {
    setBusy("generate"); setNotice("");
    try {
      await api("/api/admin/voice/agent", agent as unknown as Record<string, unknown>);
      const result = await api("/api/admin/voice/generate");
      setAgent(result.agent);
      setNotice(`Assistente preparato con ${result.provider === "openrouter" ? "GPT-5 mini tramite OpenRouter" : result.provider === "openai" ? "GPT-5 mini" : "il modello sicuro incluso"}. Controlla il saluto e le risposte.`);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Generazione non riuscita"); }
    finally { setBusy(""); }
  }

  async function runTest() {
    setBusy("test"); setNotice(""); setTestResult(null);
    try {
      await api("/api/admin/voice/agent", agent as unknown as Record<string, unknown>);
      const result = await api("/api/admin/voice/simulate", { scenario: selectedScenario.id, prompt: testPrompt });
      setTestResult(result); setAgent((current) => ({ ...current, status: result.checks.every((check: { passed: boolean }) => check.passed) ? "testing" : "draft", lastTestedAt: new Date() }));
      setNotice("Prova completata. Controlla la risposta qui sotto.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Prova non riuscita"); }
    finally { setBusy(""); }
  }

  async function markReady() {
    setBusy("ready"); setNotice("");
    try { const result = await api("/api/admin/voice/ready"); setAgent((current) => ({ ...current, status: result.status, publishedVersion: result.version })); setNotice("Assistente pronto. Ora puoi collegare o attivare il numero."); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Operazione non riuscita"); }
    finally { setBusy(""); }
  }

  async function activate() {
    if (!window.confirm("Vuoi rendere attivo l’assistente sul numero collegato? Le chiamate reali potranno essere gestite automaticamente.")) return;
    setBusy("activate"); setNotice("");
    try { const result = await api("/api/admin/voice/activate"); setAgent(result.agent); setNotice("Assistente attivato sul numero collegato."); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Attivazione non riuscita"); }
    finally { setBusy(""); }
  }

  async function pause() {
    setBusy("pause"); setNotice("");
    try { const result = await api("/api/admin/voice/pause"); setAgent((current) => ({ ...current, status: result.status, testMode: true })); setNotice("Assistente messo in pausa. Le prove restano disponibili."); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Operazione non riuscita"); }
    finally { setBusy(""); }
  }

  async function startCallTest() {
    setBusy("call"); setNotice("");
    try {
      const credentials = await api("/api/admin/voice/web-call");
      const { RetellWebClient } = await import("retell-client-js-sdk");
      const client = new RetellWebClient();
      client.on("call_started", () => { setCallActive(true); setBusy(""); });
      client.on("call_ended", () => { setCallActive(false); callClient.current = null; setNotice("Chiamata di prova terminata."); });
      client.on("error", () => { setCallActive(false); setBusy(""); setNotice("La prova vocale si è interrotta. Controlla microfono e collegamento Retell."); });
      callClient.current = client;
      await client.startCall({ accessToken: credentials.access_token });
    } catch (error) { setBusy(""); setNotice(error instanceof Error ? error.message : "Chiamata di prova non disponibile"); }
  }

  function stopCall() { callClient.current?.stopCall(); setCallActive(false); }

  function downloadJson(filename: string, data: Record<string, unknown>) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function downloadTestReport() {
    if (!testResult) return;
    downloadJson(`prova-${selectedScenario.id}-${new Date().toISOString().slice(0, 10)}.json`, {
      generatedAt: new Date().toISOString(),
      assistant: agent.name,
      category: currentCategory.label,
      language: agent.language,
      scenario: selectedScenario.title,
      expectedBehavior: selectedScenario.expected,
      customerInput: testPrompt,
      assistantOutput: testResult.output,
      checks: testResult.checks,
      modelProvider: testResult.provider,
    });
  }

  function downloadCallReport(call: VoiceCall) {
    downloadJson(`analisi-chiamata-${call.id}.json`, {
      callId: call.id,
      date: new Date(call.createdAt).toISOString(),
      mode: call.mode,
      direction: call.direction,
      durationSeconds: call.durationSeconds,
      summary: call.summary,
      outcome: call.outcome,
      transcript: call.transcript,
    });
  }

  function addService() { updateAgent("services", [...agent.services, { name: "Nuovo servizio", durationMinutes: 60, priceCents: 0, enabled: true }]); }
  function updateService(index: number, patch: Partial<VoiceService>) { updateAgent("services", agent.services.map((service, position) => position === index ? { ...service, ...patch } : service)); }
  function addFaq() { updateAgent("faqs", [...agent.faqs, { question: "", answer: "" }]); }
  function updateFaq(index: number, patch: Partial<VoiceFaq>) { updateAgent("faqs", agent.faqs.map((faq, position) => position === index ? { ...faq, ...patch } : faq)); }

  const readyChecks = [
    { label: "Attività e saluto configurati", passed: Boolean(agent.greeting && agent.services.length) },
    { label: `Prove essenziali superate (${passedRequiredTests}/${initialData.requiredScenarioIds.length})`, passed: hasPassedTest },
    { label: "Numero per parlare con lo staff", passed: Boolean(agent.transferNumber) },
    { label: "Retell e numero collegati", passed: phoneReady },
  ];

  return <main className="voice-admin-page">
    <a className="voice-admin-back" href="/admin"><ArrowLeft size={17} /> Torna alla giornata</a>
    <header className="voice-admin-header">
      <div><span>Assistente telefonico</span><h1>La tua segretaria AI</h1><p>Preparala, provala e attivala. Nessuna chiamata reale parte durante i test.</p></div>
      <div className={`voice-status ${agent.status}`}><i />{statusText[agent.status]}</div>
    </header>

    <section className="voice-setup-steps" aria-label="Stato configurazione">
      <button className={tab === "prepare" ? "active" : ""} onClick={() => setTab("prepare")}><span>1</span><div><strong>Prepara</strong><small>Scegli cosa deve sapere</small></div></button>
      <button className={tab === "test" ? "active" : ""} onClick={() => setTab("test")}><span>2</span><div><strong>Prova</strong><small>Controlla come risponde</small></div></button>
      <button className={tab === "calls" ? "active" : ""} onClick={() => setTab("calls")}><span>3</span><div><strong>Chiamate</strong><small>Leggi risultati e richieste</small></div></button>
    </section>

    {notice && <button className="voice-notice" onClick={() => setNotice("")}><Check size={17} />{notice}<span>Chiudi</span></button>}

    {tab === "prepare" && <div className="voice-admin-workspace">
      <section className="voice-config-main">
        <div className="voice-block-heading"><span>Partenza rapida</span><h2>Che tipo di attività hai?</h2><p>Carichiamo servizi, domande e regole già adatti al tuo lavoro.</p></div>
        <div className="voice-category-picker">
          <label>Categoria<select value={agent.category} onChange={(event) => updateAgent("category", event.target.value)}>{categories.map((category) => <option value={category.id} key={category.id}>{category.label}</option>)}</select><ChevronDown size={16} /></label>
          <div><strong>{currentCategory.label}</strong><p>{currentCategory.description}</p></div>
          <button onClick={loadCategory}><Sparkles size={16} /> Usa questo modello</button>
        </div>

        <div className="voice-fields voice-basic-fields">
          <label>Come vuoi chiamarla?<input value={agent.name} onChange={(event) => updateAgent("name", event.target.value)} /></label>
          <label>In che lingua parla?<select value={agent.language} onChange={(event) => changeLanguage(event.target.value)}><option value="it-IT">Italiano</option><option value="en-US">English</option><option value="it-IT,en-US">Automatico: Italiano + English</option></select><small>In automatico riconosce la lingua di chi chiama e risponde nella stessa lingua. Una lingua singola resta più precisa.</small></label>
          <label>Come saluta chi chiama?<textarea value={agent.greeting} onChange={(event) => updateAgent("greeting", event.target.value)} /></label>
        </div>

        <div className="voice-list-heading"><div><span>Servizi modificabili</span><h2>Cosa può prenotare</h2><p>Questi sono esempi di partenza. Aggiungi i servizi reali, correggi durata e prezzo oppure elimina quelli che non offri.</p></div><button title="Aggiungi servizio" onClick={addService}><Plus size={18} /></button></div>
        <div className="voice-service-list">
          {agent.services.map((service, index) => <div className="voice-service-row" key={`${index}-${service.name}`}>
            <input aria-label="Nome servizio" value={service.name} onChange={(event) => updateService(index, { name: event.target.value })} />
            <label><Clock3 size={15} /><input aria-label="Durata in minuti" type="number" min="15" step="15" value={service.durationMinutes} onChange={(event) => updateService(index, { durationMinutes: Number(event.target.value) })} /><span>min</span></label>
            <label><span>€</span><input aria-label="Prezzo" type="number" min="0" step="1" value={service.priceCents / 100} onChange={(event) => updateService(index, { priceCents: Math.round(Number(event.target.value) * 100) })} /></label>
            <button title="Rimuovi servizio" onClick={() => updateAgent("services", agent.services.filter((_, position) => position !== index))}><Trash2 size={16} /></button>
          </div>)}
        </div>

        <div className="voice-list-heading"><div><span>Risposte pronte</span><h2>Le domande più frequenti</h2></div><button title="Aggiungi domanda" onClick={addFaq}><Plus size={18} /></button></div>
        <div className="voice-faq-editor">{agent.faqs.map((faq, index) => <div key={index}><input aria-label={`Domanda ${index + 1}`} placeholder="Domanda del cliente" value={faq.question} onChange={(event) => updateFaq(index, { question: event.target.value })} /><textarea aria-label={`Risposta ${index + 1}`} placeholder="Risposta approvata" value={faq.answer} onChange={(event) => updateFaq(index, { answer: event.target.value })} /><button title="Rimuovi domanda" onClick={() => updateAgent("faqs", agent.faqs.filter((_, position) => position !== index))}><Trash2 size={16} /></button></div>)}</div>

        <details className="voice-advanced"><summary><Settings2 size={17} /> Impostazioni avanzate</summary><div>
          <label>Istruzioni complete<textarea value={agent.systemPrompt} onChange={(event) => updateAgent("systemPrompt", event.target.value)} /></label>
          <label>Codice assistente Retell<input value={agent.retellAgentId || ""} onChange={(event) => updateAgent("retellAgentId", event.target.value || null)} placeholder="agent_..." /></label>
          <label>Codice voce Retell<input value={agent.voiceId} onChange={(event) => updateAgent("voiceId", event.target.value)} /></label>
          <label>Numero collegato<input value={agent.retellPhoneNumber || ""} onChange={(event) => updateAgent("retellPhoneNumber", event.target.value || null)} placeholder="+39..." /></label>
        </div></details>
      </section>

      <aside className="voice-config-side">
        <span>Comportamento</span><h2>Cosa può fare da sola</h2>
        <label className="voice-toggle"><input aria-label="Gestire appuntamenti" type="checkbox" checked={agent.bookingEnabled} onChange={(event) => updateAgent("bookingEnabled", event.target.checked)} /><i /><div><strong>Gestire appuntamenti</strong><small>Controlla gli orari e chiede conferma.</small></div></label>
        <label className="voice-toggle"><input aria-label="Registrare l’audio" type="checkbox" checked={agent.recordingEnabled} onChange={(event) => updateAgent("recordingEnabled", event.target.checked)} /><i /><div><strong>Registrare l’audio</strong><small>Disattivato di base. Richiede informativa e consenso adeguati.</small></div></label>
        <label>Numero dello staff<input value={agent.transferNumber || ""} onChange={(event) => updateAgent("transferNumber", event.target.value || null)} placeholder="+39..." /><small>La chiamata passa qui quando serve una persona.</small></label>
        <div className="voice-ai-box"><Bot size={23} /><strong>GPT-5 mini prepara il lavoro</strong><p>Crea saluto, istruzioni e FAQ partendo dal modello scelto. Tu controlli sempre il risultato.</p><button disabled={Boolean(busy)} onClick={generate}>{busy === "generate" ? <LoaderCircle className="spin" size={17} /> : <Sparkles size={17} />} Prepara con AI</button></div>
        <button className="voice-save" disabled={Boolean(busy)} onClick={save}>{busy === "save" ? <LoaderCircle className="spin" size={17} /> : <Save size={17} />} Salva configurazione</button>
      </aside>
    </div>}

    {tab === "test" && <div className="voice-test-layout">
      <section className="voice-scenario-panel"><div className="voice-block-heading"><span>Prova senza rischi</span><h2>Scegli una situazione reale</h2><p>L’assistente risponde, ma non prenota e non contatta nessuno.</p></div><div className="voice-scenario-list">{initialData.scenarios.map((scenario) => <button className={selectedScenario.id === scenario.id ? "active" : ""} key={scenario.id} onClick={() => chooseScenario(scenario)}><span>{scenario.title}</span><small>{scenario.expected}</small></button>)}</div></section>
      <section className="voice-simulator">
        <div className="voice-simulator-top"><span><Volume2 size={17} /> Simulatore</span><b>Non modifica dati reali</b></div>
        <label className="voice-test-language">Lingua della prova<select value={agent.language} onChange={(event) => changeLanguage(event.target.value)}><option value="it-IT">Italiano</option><option value="en-US">English</option><option value="it-IT,en-US">Automatico: Italiano + English</option></select></label>
        <div className="voice-customer-line"><small>Il cliente dice</small><textarea value={testPrompt} onChange={(event) => setTestPrompt(event.target.value)} /></div>
        {testResult ? <div className="voice-agent-answer"><small>{agent.name} risponde</small><p>{testResult.output}</p><div>{testResult.checks.map((check) => <span className={check.passed ? "passed" : "review"} key={check.label}>{check.passed ? <Check size={14} /> : <Eye size={14} />}{check.label}</span>)}</div><button className="voice-download-report" onClick={downloadTestReport}><Download size={15} /> Scarica la prova</button></div> : <div className="voice-test-empty"><Mic size={28} /><p>Avvia la prova per leggere qui la risposta.</p></div>}
        <button className="voice-run-test" disabled={Boolean(busy) || !testPrompt.trim()} onClick={runTest}>{busy === "test" ? <LoaderCircle className="spin" size={17} /> : <Play size={17} />} Prova la risposta</button>
        <div className="voice-real-test"><div><strong>Vuoi sentirla davvero?</strong><p>Usa il microfono del computer per una chiamata di prova con Retell.</p></div>{callActive ? <button onClick={stopCall}><CircleStop size={17} /> Termina</button> : <button disabled={!retellConnected || Boolean(busy)} onClick={startCallTest}>{busy === "call" ? <LoaderCircle className="spin" size={17} /> : <PhoneCall size={17} />} Avvia prova vocale</button>}</div>
      </section>
      <aside className="voice-launch-panel"><span>Controllo finale</span><h2>{agent.status === "live" ? "L’assistente è attivo" : "Quando sei soddisfatto"}</h2><div className="voice-ready-list">{readyChecks.map((check) => <div className={check.passed ? "done" : ""} key={check.label}>{check.passed ? <Check size={15} /> : <span />}{check.label}</div>)}</div>
        {agent.status === "live" ? <button className="voice-pause-button" disabled={Boolean(busy)} onClick={pause}><Pause size={17} /> Metti in pausa</button> : agent.status === "ready" ? <button className="voice-activate-button" disabled={!phoneReady || Boolean(busy)} onClick={activate}><Rocket size={17} /> Attiva il numero</button> : <button className="voice-ready-button" disabled={!hasPassedTest || Boolean(busy)} onClick={markReady}><ListChecks size={17} /> Segna come pronta</button>}
        {!phoneReady && <p className="voice-connection-note">Puoi completare tutti i test. Per le chiamate reali servono chiave Retell, codice assistente e numero collegato.</p>}
      </aside>
    </div>}

    {tab === "calls" && <section className="voice-calls-section">
      <div className="voice-block-heading"><span>Registro</span><h2>Ogni chiamata, già ordinata.</h2><p>Vedi motivo, risultato e conversazione. Le prove sono sempre separate dalle chiamate reali.</p></div>
      <div className="voice-call-metrics"><div><strong>{initialData.calls.length}</strong><span>chiamate registrate</span></div><div><strong>{Math.round(initialData.calls.reduce((sum, call) => sum + call.durationSeconds, 0) / 60)}</strong><span>minuti totali</span></div><div><strong>{initialData.calls.filter((call) => call.mode === "test").length}</strong><span>prove</span></div></div>
      <div className="voice-call-list">{initialData.calls.length ? initialData.calls.map((call) => <details key={call.id}><summary><span className={`call-mode ${call.mode}`}>{call.mode === "test" ? "Prova" : "Reale"}</span><div><strong>{call.summary || "Chiamata senza riepilogo"}</strong><small>{new Date(call.createdAt).toLocaleString("it-IT", { dateStyle: "medium", timeStyle: "short" })} · {Math.max(1, Math.round(call.durationSeconds / 60))} min</small></div><span>{call.outcome || call.status}</span></summary><div className="voice-transcript-admin">{call.transcript.length ? call.transcript.map((turn, index) => <p className={turn.role} key={index}><b>{turn.role === "agent" ? agent.name : "Cliente"}</b>{turn.text}</p>) : <p>Nessuna trascrizione disponibile.</p>}<div className="voice-call-downloads"><button onClick={() => downloadCallReport(call)}><Download size={15} /> Scarica analisi</button>{call.hasRecording && <a href={`/api/admin/voice/calls/${call.id}/recording`}><Volume2 size={15} /> Scarica audio</a>}</div></div></details>) : <div className="voice-no-calls"><PhoneCall size={28} /><h3>Qui appariranno le chiamate</h3><p>Fai una prova per controllare riepilogo e conversazione.</p></div>}</div>
    </section>}
  </main>;
}
