import { requireApiAdmin } from "../../../lib/api-auth";
import { getDashboardData } from "../../../lib/repository";
export async function GET(request: Request) { const auth = await requireApiAdmin(request); if (auth.response) return auth.response; return Response.json({ ok: true, data: await getDashboardData(auth.session.organizationId) }); }
