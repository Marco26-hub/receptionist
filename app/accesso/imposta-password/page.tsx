import type { Metadata } from "next";
import Link from "next/link";
import { SetPasswordForm } from "../../components/SetPasswordForm";

export const metadata: Metadata = { title: "Imposta la password", robots: { index: false, follow: false } };

export default function SetPasswordPage() {
  return <main className="auth-page"><Link className="brand" href="/">AgendaPiena AI</Link><section><div><span className="eyebrow">Invito al team</span><h1>Crea il tuo accesso personale.</h1><p>Imposta una password e accedi soltanto alle informazioni dell’attività a cui sei stato invitato.</p></div><SetPasswordForm supabaseUrl={process.env.SUPABASE_URL || ""} anonKey={process.env.SUPABASE_ANON_KEY || ""} /></section></main>;
}
