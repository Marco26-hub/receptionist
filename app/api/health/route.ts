import { isDatabaseConfigured } from "../../../db";
export async function GET() { return Response.json({ status: "ok", version: "1.0.0", database: isDatabaseConfigured() ? "configured" : "demo", ai: Boolean(process.env.OPENAI_API_KEY), whatsapp: Boolean(process.env.WHATSAPP_ACCESS_TOKEN), payments: Boolean(process.env.STRIPE_SECRET_KEY) }); }

