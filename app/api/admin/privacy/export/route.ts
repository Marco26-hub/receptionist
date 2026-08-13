import { requireApiAdmin } from "../../../../lib/api-auth";
import { exportCustomerData, exportOrganizationData } from "../../../../lib/privacy-data";
import { jsonError, readJson, ValidationError } from "../../../../lib/validation";

export async function POST(request: Request) {
  const auth = await requireApiAdmin(request); if (auth.response) return auth.response;
  try {
    const body = await readJson(request);
    const scope = body.scope;
    const customerId = typeof body.customerId === "string" ? body.customerId : null;
    let data: unknown;
    let filename: string;
    if (scope === "customer") {
      if (auth.session.role === "staff") throw new ValidationError("Serve un proprietario o responsabile per esportare i dati");
      if (!customerId) throw new ValidationError("Scegli un cliente");
      data = await exportCustomerData(auth.session.organizationId, customerId, auth.session.email);
      filename = `dati-cliente-${customerId}.json`;
    } else {
      if (auth.session.role !== "owner") throw new ValidationError("Solo il proprietario può esportare tutti i dati dell’attività");
      data = await exportOrganizationData(auth.session.organizationId, auth.session.email);
      filename = `dati-attivita-${new Date().toISOString().slice(0, 10)}.json`;
    }
    return new Response(JSON.stringify(data, null, 2), { headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "private, no-store" } });
  } catch (error) { return jsonError(error); }
}
