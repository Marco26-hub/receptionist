import { requireApiAdmin } from "../../../lib/api-auth";
import { getDashboardData } from "../../../lib/repository";
export async function GET() { const auth = await requireApiAdmin(); if (auth.response) return auth.response; return Response.json({ ok: true, data: await getDashboardData() }); }

