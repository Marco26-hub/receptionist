import { requireApiAdmin } from "../../../../lib/api-auth";
import { eraseCustomerData } from "../../../../lib/privacy-data";
import { jsonError, readJson, requiredText, ValidationError } from "../../../../lib/validation";

export async function DELETE(request: Request) {
  const auth = await requireApiAdmin(request); if (auth.response) return auth.response;
  try {
    if (auth.session.role !== "owner") throw new ValidationError("Solo il proprietario può rendere anonimo un cliente");
    const body = await readJson(request);
    if (body.confirmation !== "ELIMINA") throw new ValidationError("Scrivi ELIMINA per confermare");
    const result = await eraseCustomerData(auth.session.organizationId, requiredText(body.customerId, "Cliente", 100), auth.session.email);
    return Response.json(result);
  } catch (error) { return jsonError(error); }
}
