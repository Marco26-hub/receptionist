import { requireApiAdmin } from "../../../../../lib/api-auth";
import { updateMessageStatus } from "../../../../../lib/repository";
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) { const auth = await requireApiAdmin(); if (auth.response) return auth.response; const { id } = await params; const result = await updateMessageStatus({ opportunityId: id, status: "dismissed", actorEmail: auth.session.email }); return Response.json(result); }
