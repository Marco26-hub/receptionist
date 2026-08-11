import { requireApiAdmin } from "../../../../../../lib/api-auth";
import { getVoiceCallRecording } from "../../../../../../lib/voice-repository";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApiAdmin(request); if (auth.response) return auth.response;
  const { id } = await context.params;
  const call = await getVoiceCallRecording(auth.session.organizationId, id);
  if (!call?.recordingUrl) return Response.json({ ok: false, error: "Registrazione non disponibile" }, { status: 404 });
  try {
    const url = new URL(call.recordingUrl);
    if (url.protocol !== "https:") throw new Error("URL non sicuro");
    const recording = await fetch(url, { redirect: "follow" });
    if (!recording.ok || !recording.body) throw new Error("Audio non disponibile");
    return new Response(recording.body, {
      headers: {
        "Content-Type": recording.headers.get("content-type") || "audio/mpeg",
        "Content-Disposition": `attachment; filename="prova-voce-${call.externalCallId || id}.mp3"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return Response.json({ ok: false, error: "Non siamo riusciti a scaricare la registrazione" }, { status: 502 });
  }
}
