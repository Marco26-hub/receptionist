import type { MetadataRoute } from "next";
import { cities, siteUrl } from "./lib/site";
const routes = ["", "/prodotto", "/come-funziona", "/prezzi", "/settori/centri-estetici", "/settori/cliniche-estetiche", "/risorse", "/risorse/recuperare-clienti-centro-estetico", "/risorse/riempire-orari-liberi", "/risorse/messaggi-whatsapp-centro-estetico", "/chi-siamo", "/contatti"];
export default function sitemap(): MetadataRoute.Sitemap { const now = new Date(); return [...routes.map((route) => ({ url: `${siteUrl}${route}`, lastModified: now, changeFrequency: route.startsWith("/risorse/") ? "monthly" as const : "weekly" as const, priority: route === "" ? 1 : route === "/prodotto" || route === "/prezzi" ? 0.9 : 0.7 })), ...cities.map((city) => ({ url: `${siteUrl}/citta/${city.slug}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.6 }))]; }

