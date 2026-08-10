import { createCheckoutSession } from "../../lib/stripe";
import { jsonError, readJson, requiredText, validEmail } from "../../lib/validation";
export async function POST(request: Request) { try { const body = await readJson(request); const origin = new URL(request.url).origin; const session = await createCheckoutSession({ email: validEmail(body.email), organizationName: requiredText(body.organizationName, "Nome del centro"), origin }); return Response.json({ ok: true, url: session.url, demo: "demo" in session ? session.demo : false }); } catch (error) { return jsonError(error); } }

