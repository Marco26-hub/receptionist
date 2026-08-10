import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title:
    "AgendaPiena AI | Software AI WhatsApp per centri estetici premium",
  description:
    "Assistente AI premium per centri estetici in Italia: recupera clienti ferme, riempie buchi in agenda e prepara messaggi WhatsApp da approvare.",
  keywords: [
    "software AI centri estetici",
    "assistente WhatsApp centri estetici",
    "recupero clienti inattive centro estetico",
    "AI booking beauty",
    "gestionale AI beauty premium",
    "campagne WhatsApp centro estetico",
    "agenda piena centro estetico",
    "segretaria AI beauty Italia",
  ],
  authors: [{ name: "AgendaPiena AI" }],
  creator: "AgendaPiena AI",
  publisher: "AgendaPiena AI",
  alternates: {
    canonical: "https://agendapiena-ai.chatgpt.app",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "AgendaPiena AI | Recupero clienti e agenda piena per beauty",
    description:
      "Trova clienti ferme, orari vuoti e messaggi da inviare. Approva tutto da mobile, con il tono del tuo centro.",
    type: "website",
    locale: "it_IT",
    siteName: "AgendaPiena AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "AgendaPiena AI",
    description:
      "Assistente AI premium per centri estetici: clienti ferme, orari vuoti e messaggi WhatsApp pronti da approvare.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
