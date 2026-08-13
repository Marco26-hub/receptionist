import { requireApiAdmin } from "../../../../lib/api-auth";
import { runRetentionCleanup, saveRetentionPolicy } from "../../../../lib/privacy-data";
import { jsonError, readJson, ValidationError } from "../../../../lib/validation";

function days(value: unknown, label: string, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) throw new ValidationError(`${label}: inserisci un numero tra ${min} e ${max} giorni`);
  return parsed;
}

export async function PUT(request: Request) {
  const auth = await requireApiAdmin(request); if (auth.response) return auth.response;
  try {
    if (auth.session.role !== "owner") throw new ValidationError("Solo il proprietario può cambiare i tempi di conservazione");
    const body = await readJson(request);
    const policy = await saveRetentionPolicy({
      organizationId: auth.session.organizationId,
      actorEmail: auth.session.email,
      messageContentDays: days(body.messageContentDays, "Messaggi", 30, 1825),
      voiceTranscriptDays: days(body.voiceTranscriptDays, "Trascrizioni", 7, 730),
      recordingDays: days(body.recordingDays, "Registrazioni", 1, 365),
      auditLogDays: days(body.auditLogDays, "Registro attività", 365, 3650),
    });
    return Response.json({ ok: true, policy });
  } catch (error) { return jsonError(error); }
}

export async function POST(request: Request) {
  const auth = await requireApiAdmin(request); if (auth.response) return auth.response;
  try {
    if (auth.session.role !== "owner") throw new ValidationError("Solo il proprietario può avviare la pulizia dei dati");
    return Response.json({ ok: true, result: await runRetentionCleanup(auth.session.organizationId) });
  } catch (error) { return jsonError(error); }
}
