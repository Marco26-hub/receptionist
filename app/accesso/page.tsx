import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "../components/LoginForm";
export const metadata: Metadata = { title: "Accesso riservato", robots: { index: false, follow: false } };
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) { const { returnTo } = await searchParams; return <main className="auth-page"><Link className="brand" href="/"><span className="brand-mark">A</span><span>AgendaPiena AI</span></Link><section><div><span className="eyebrow">Area riservata</span><h1>Il tuo centro, sotto controllo.</h1><p>Accedi alle opportunità, controlla i messaggi e misura gli appuntamenti recuperati.</p></div><LoginForm returnTo={returnTo} /></section></main>; }
