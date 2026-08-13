import { requireApiAdmin } from "../../../../lib/api-auth";
import { connectWhatsApp, disconnectWhatsApp } from "../../../../lib/whatsapp";
import { jsonError, readJson, requiredText, ValidationError } from "../../../../lib/validation";

export async function POST(request: Request) {
  const auth = await requireApiAdmin(request); if (auth.response) return auth.response;
  try {
    if (auth.session.role === "staff") throw new ValidationError("Serve un proprietario o responsabile per collegare WhatsApp");
    const body = await readJson(request);
    const status = await connectWhatsApp({
      organizationId: auth.session.organizationId,
      actorEmail: auth.session.email,
      accessToken: requiredText(body.accessToken, "Token Meta", 2000),
      phoneNumberId: requiredText(body.phoneNumberId, "ID numero WhatsApp", 40),
      appSecret: requiredText(body.appSecret, "App Secret Meta", 200),
      verifyToken: requiredText(body.verifyToken, "Token di verifica", 200),
      templateName: requiredText(body.templateName, "Nome template", 512),
      templateLanguage: requiredText(body.templateLanguage, "Lingua template", 15),
    });
    return Response.json({ ok: true, status });
  } catch (error) { return jsonError(error); }
}

export async function DELETE(request: Request) {
  const auth = await requireApiAdmin(request); if (auth.response) return auth.response;
  try {
    if (auth.session.role === "staff") throw new ValidationError("Serve un proprietario o responsabile per scollegare WhatsApp");
    await disconnectWhatsApp(auth.session.organizationId, auth.session.email);
    return Response.json({ ok: true });
  } catch (error) { return jsonError(error); }
}
