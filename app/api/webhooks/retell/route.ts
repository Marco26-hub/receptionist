import { verifyRetellSignature } from "../../../lib/retell";
import { recordRetellCallEvent } from "../../../lib/voice-repository";

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!verifyRetellSignature(rawBody, request.headers.get("x-retell-signature"))) return Response.json({ ok: false }, { status: 401 });
  try {
    const payload = JSON.parse(rawBody) as { event?: string; call?: Record<string, unknown> };
    if (!payload.event || !payload.call) return Response.json({ ok: false }, { status: 400 });
    await recordRetellCallEvent(payload.event, payload.call);
    return new Response(null, { status: 204 });
  } catch { return Response.json({ ok: false }, { status: 400 }); }
}
