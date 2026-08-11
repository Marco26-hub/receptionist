import { requireApiAdmin } from "../../../lib/api-auth";
import { runDailyOptimization } from "../../../lib/repository";
export async function POST(request: Request) { const auth = await requireApiAdmin(request); if (auth.response) return auth.response; return Response.json({ ok: true, ...(await runDailyOptimization(auth.session.organizationId)) }); }
