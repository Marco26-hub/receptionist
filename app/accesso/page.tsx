import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LoginForm } from "../components/LoginForm";
export const metadata: Metadata = { title: "Accesso riservato", robots: { index: false, follow: false } };
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) { const { returnTo } = await searchParams; return <main className="auth-page"><Link className="brand" href="/"><span className="brand-mark"><Image src="/agendapiena-mark.svg" alt="" width={34} height={34} /></span><span>AgendaPiena AI</span></Link><section><div><span className="eyebrow">Area riservata</span><h1>Il tuo centro, sotto controllo.</h1><p>Accedi alle opportunità, controlla i messaggi e misura gli appuntamenti recuperati.</p></div><LoginForm returnTo={returnTo} /></section></main>; }
