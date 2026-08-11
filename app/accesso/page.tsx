import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LoginForm } from "../components/LoginForm";
export const metadata: Metadata = { title: "Accesso riservato", robots: { index: false, follow: false } };
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) { const { returnTo } = await searchParams; return <main className="auth-page"><Link className="brand" href="/"><span className="brand-mark"><Image src="/agendapiena-mark.svg" alt="" width={34} height={34} /></span><span>AgendaPiena AI</span></Link><section><div><span className="eyebrow">Area riservata</span><h1>La tua attività, sempre organizzata.</h1><p>Controlla richieste, messaggi, appuntamenti e chiamate in un unico posto.</p></div><LoginForm returnTo={returnTo} /></section></main>; }
