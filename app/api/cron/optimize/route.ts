import { runDailyOptimization } from "../../../lib/repository";
import { enforceAllBillingStates } from "../../../lib/billing-enforcement";
import { runRetentionCleanup } from "../../../lib/privacy-data";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (process.env.NODE_ENV === "production" && (!secret || request.headers.get("authorization") !== `Bearer ${secret}`)) return Response.json({ ok: false }, { status: 401 });
  const [optimization, billing, privacy] = await Promise.all([runDailyOptimization(), enforceAllBillingStates(), runRetentionCleanup()]);
  return Response.json({ ok: true, ...optimization, billing, privacy, completedAt: new Date().toISOString() });
}
