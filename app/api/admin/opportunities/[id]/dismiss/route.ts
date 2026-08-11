import { requireApiAdmin } from "../../../../../lib/api-auth";
import { dismissOpportunity } from "../../../../../lib/repository";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { const auth = await requireApiAdmin(request); if (auth.response) return auth.response; const { id } = await params; const result = await dismissOpportunity({ organizationId: auth.session.organizationId, opportunityId: id, actorEmail: auth.session.email }); return Response.json(result); }
