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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://agendapiena.ai"),
  title: { default: "AgendaPiena AI | Più appuntamenti per centri estetici", template: "%s | AgendaPiena AI" },
  description:
    "AgendaPiena AI aiuta i centri estetici a recuperare clienti, riempire gli orari liberi e preparare messaggi WhatsApp personali.",
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
  category: "technology",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "AgendaPiena AI | Più appuntamenti, meno tempo perso",
    description:
      "Trova clienti da ricontattare e orari da riempire. Approva messaggi WhatsApp personali direttamente dal telefono.",
    type: "website",
    locale: "it_IT",
    siteName: "AgendaPiena AI",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "AgendaPiena AI",
    description:
      "L’assistente AI per centri estetici che recupera clienti e riempie gli orari liberi.",
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
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
