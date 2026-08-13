import { requireApiAdmin } from "../../../../lib/api-auth";
import { getBillingIdentity } from "../../../../lib/repository";
import { createCustomerPortalSession } from "../../../../lib/stripe";
import { jsonError } from "../../../../lib/validation";

export async function POST(request: Request) {
  try {
    const auth = await requireApiAdmin(request);
    if (auth.response) return auth.response;
    if (!auth.session || !["owner", "manager"].includes(auth.session.role)) return Response.json({ ok: false, error: "Operazione non autorizzata" }, { status: 403 });
    const identity = await getBillingIdentity(auth.session.organizationId);
    if (!identity.stripeCustomerId) throw new Error("Non risulta ancora un account di pagamento attivo");
    const origin = process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL).origin : new URL(request.url).origin;
    const portal = await createCustomerPortalSession({ customerId: identity.stripeCustomerId, returnUrl: `${origin}/admin/abbonamento` });
    return Response.json({ ok: true, url: portal.url });
  } catch (error) { return jsonError(error); }
}
