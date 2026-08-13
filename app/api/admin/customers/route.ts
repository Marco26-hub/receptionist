import { requireApiAdmin } from "../../../lib/api-auth";
import { createCustomer } from "../../../lib/repository";
import { jsonError, optionalText, readJson, requiredText } from "../../../lib/validation";

export async function POST(request: Request) {
  const auth = await requireApiAdmin(request); if (auth.response) return auth.response;
  try {
    const body = await readJson(request);
    const rows = Array.isArray(body.rows) ? body.rows.slice(0, 1000) : [body];
    const results = [];
    for (const raw of rows) {
      const row = raw as Record<string, unknown>;
      const lastVisitAt = optionalDate(row.lastVisitAt);
      results.push(await createCustomer(auth.session.organizationId, {
        firstName: requiredText(row.firstName, "Nome", 80),
        lastName: optionalText(row.lastName, 80),
        phone: requiredText(row.phone, "Telefono", 40),
        email: optionalText(row.email, 254),
        lastVisitAt,
        lifetimeValueCents: nonNegativeInt(row.lifetimeValueCents),
        preferredServices: Array.isArray(row.preferredServices) ? row.preferredServices.filter((item): item is string => typeof item === "string").slice(0, 20) : typeof row.preferredServices === "string" ? row.preferredServices.split(/[|;]/).map((item) => item.trim()).filter(Boolean).slice(0, 20) : [],
        marketingConsent: consentValue(row.marketingConsent),
        notes: optionalText(row.notes, 1000),
        actorEmail: auth.session.email,
        consentSource: body.source === "importazione_csv" ? "importazione_csv" : "inserimento_manuale",
      }));
    }
    return Response.json({ ok: true, imported: results.length, demo: results.every((item) => item.demo) });
  } catch (error) { return jsonError(error); }
}

function optionalDate(value: unknown) {
  if (!value) return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) throw new Error("Data ultima visita non valida");
  return date;
}
function nonNegativeInt(value: unknown) { const parsed = Number(value || 0); return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0; }

function consentValue(value: unknown): boolean | null {
  if (value === undefined || value === null || value === "") return null;
  if (value === true || ["true", "si", "sì", "1", "yes"].includes(String(value).trim().toLocaleLowerCase("it"))) return true;
  if (value === false || ["false", "no", "0"].includes(String(value).trim().toLocaleLowerCase("it"))) return false;
  throw new Error(`Consenso marketing non riconosciuto: ${String(value).slice(0, 30)}`);
}
