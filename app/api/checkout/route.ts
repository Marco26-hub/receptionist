import { requireApiAdmin } from "../../lib/api-auth";
import { getBillingIdentity } from "../../lib/repository";
import { createCheckoutSession, isStripePlanKey } from "../../lib/stripe";
import { jsonError, readJson } from "../../lib/validation";

export async function POST(request: Request) {
  try {
    const auth = await requireApiAdmin(request);
    if (auth.response) return auth.response;
    if (!auth.session || !["owner", "manager"].includes(auth.session.role)) return Response.json({ ok: false, error: "Solo il titolare o un responsabile può attivare un piano" }, { status: 403 });
    const body = await readJson(request);
    if (!isStripePlanKey(body.planKey)) throw new Error("Piano non valido");
    const identity = await getBillingIdentity(auth.session.organizationId);
    if (identity.stripeCustomerId) throw new Error("Hai già un account Stripe: usa Gestisci pagamento per cambiare piano senza creare un doppio abbonamento");
    const origin = process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL).origin : new URL(request.url).origin;
    const session = await createCheckoutSession({ email: auth.session.email, organizationId: auth.session.organizationId, organizationName: identity.organizationName, origin, planKey: body.planKey });
    return Response.json({ ok: true, url: session.url });
  } catch (error) { return jsonError(error); }
}
