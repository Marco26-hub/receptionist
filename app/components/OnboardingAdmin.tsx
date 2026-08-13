import { ArrowLeft, Check, ChevronRight, Circle } from "lucide-react";

type Step = { id: string; title: string; detail: string; href: string; done: boolean };

export function OnboardingAdmin({ data }: { data: { organization?: { name: string }; completed: number; total: number; steps: Step[]; mode: "demo" | "live" } }) {
  const percent = Math.round((data.completed / Math.max(1, data.total)) * 100);
  return <main className="onboarding-page">
    <a href="/admin"><ArrowLeft size={17} /> Torna alla giornata</a>
    <header><div><span>Configurazione assistita</span><h1>Prepariamo {data.organization?.name || "la tua attività"}.</h1><p>Completa un passaggio alla volta. Ogni controllo usa lo stato reale del tuo account.</p></div><div className="onboarding-score"><strong>{percent}%</strong><span>{data.completed} di {data.total} completati</span></div></header>
    <div className="onboarding-progress"><i style={{ width: `${percent}%` }} /></div>
    <section className="onboarding-steps">{data.steps.map((step, index) => <a href={step.href} className={step.done ? "done" : ""} key={step.id}><span>{step.done ? <Check size={18} /> : <Circle size={18} />}</span><b>0{index + 1}</b><div><h2>{step.title}</h2><p>{step.detail}</p></div><em>{step.done ? "Completato" : "Da completare"}</em><ChevronRight size={18} /></a>)}</section>
  </main>;
}
