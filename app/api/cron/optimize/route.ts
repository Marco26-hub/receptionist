import { runDailyOptimization } from "../../../lib/repository";
import { enforceAllBillingStates } from "../../../lib/billing-enforcement";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (process.env.NODE_ENV === "production" && (!secret || request.headers.get("authorization") !== `Bearer ${secret}`)) return Response.json({ ok: false }, { status: 401 });
  const [optimization, billing] = await Promise.all([runDailyOptimization(), enforceAllBillingStates()]);
  return Response.json({ ok: true, ...optimization, billing, completedAt: new Date().toISOString() });
}
