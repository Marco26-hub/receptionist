import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://agendapiena.ai"),
  title: { default: "AgendaPiena AI | Più appuntamenti, meno tempo perso", template: "%s | AgendaPiena AI" },
  description:
    "AgendaPiena AI aiuta attività su appuntamento a recuperare clienti, riempire gli orari liberi e preparare messaggi WhatsApp personali.",
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
    images: [{ url: "/agendapiena-luxury-receptionist.png", width: 1536, height: 2304, alt: "Assistente AgendaPiena al telefono in un centro premium" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AgendaPiena AI",
    description:
      "L’assistente AI per centri estetici che recupera clienti e riempie gli orari liberi.",
    images: ["/agendapiena-luxury-receptionist.png"],
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
      <body>{children}</body>
    </html>
  );
}
