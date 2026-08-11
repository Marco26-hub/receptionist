import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("uses the Vercel-compatible Next.js runtime", async () => {
  const packageJson = JSON.parse(await read("package.json"));
  assert.equal(packageJson.scripts.build, "next build");
  assert.ok(packageJson.dependencies.next);
  assert.ok(packageJson.dependencies.postgres);
  assert.equal(packageJson.dependencies.vinext, undefined);
});

test("keeps sensitive actions behind explicit approval", async () => {
  const [dashboard, whatsapp, optimization] = await Promise.all([read("app/components/AdminDashboard.tsx"), read("app/lib/whatsapp.ts"), read("app/lib/optimization.ts")]);
  assert.match(dashboard, /Approva/);
  assert.match(dashboard, /Scarta/);
  assert.match(whatsapp, /WHATSAPP_ACCESS_TOKEN/);
  assert.match(optimization, /marketingConsent/);
  assert.match(optimization, /doNotContact/);
});

test("ships PostgreSQL migrations and operational endpoints", async () => {
  const migrations = await readdir(new URL("drizzle/", root));
  assert.ok(migrations.some((name) => name.endsWith(".sql")));
  await Promise.all(["app/api/health/route.ts", "app/api/leads/route.ts", "app/api/cron/optimize/route.ts", "app/api/webhooks/whatsapp/route.ts", "app/api/webhooks/stripe/route.ts"].map((path) => read(path)));
});

test("scopes operational data and approval to the authenticated organization", async () => {
  const [repository, approve, generate, auth] = await Promise.all([
    read("app/lib/repository.ts"),
    read("app/api/admin/opportunities/[id]/approve/route.ts"),
    read("app/api/admin/messages/generate/route.ts"),
    read("app/lib/auth.ts"),
  ]);
  assert.match(auth, /organizationId/);
  assert.match(repository, /eq\(opportunities\.organizationId, organizationId\)/);
  assert.match(approve, /auth\.session\.organizationId/);
  assert.match(approve, /requiredText\(input\.body/);
  assert.match(generate, /getOpportunityDraftContext/);
});

test("includes data ingestion, conversion, settings and explicit AI privacy opt-in", async () => {
  await Promise.all([
    "app/api/admin/customers/route.ts",
    "app/api/admin/appointments/route.ts",
    "app/api/admin/opportunities/[id]/convert/route.ts",
    "app/api/admin/settings/route.ts",
    "app/admin/impostazioni/page.tsx",
  ].map((path) => read(path)));
  const [ai, directSend, health] = await Promise.all([read("app/lib/ai.ts"), read("app/api/admin/messages/send/route.ts"), read("app/api/health/route.ts")]);
  assert.match(ai, /AI_DRAFTS_ENABLED/);
  assert.match(directSend, /status: 410/);
  assert.match(health, /WHATSAPP_TEMPLATE_NAME/);
  assert.match(health, /status: production && !coreReady \? 503 : 200/);
});

test("supports Supabase Auth without exposing the provider token to the browser", async () => {
  const [provider, login] = await Promise.all([read("app/lib/identity-provider.ts"), read("app/api/auth/login/route.ts")]);
  assert.match(provider, /SUPABASE_URL/);
  assert.match(provider, /auth\/v1\/token\?grant_type=password/);
  assert.match(login, /authenticateIdentity/);
  assert.doesNotMatch(login, /access_token/);
});

test("ships an executable deployment gate and go-live runbook", async () => {
  const [packageJson, checkEnv, runbook] = await Promise.all([read("package.json"), read("scripts/check-env.mjs"), read("GO_LIVE.md")]);
  assert.match(packageJson, /check:env/);
  assert.match(checkEnv, /WHATSAPP_TEMPLATE_NAME/);
  assert.match(checkEnv, /RETELL_API_KEY/);
  assert.match(checkEnv, /LEGAL_COMPANY_NAME/);
  assert.match(runbook, /api\/health\?deep=1/);
});

test("ships Render, Neon and free scheduled optimization configuration", async () => {
  const [render, drizzle, workflow] = await Promise.all([read("render.yaml"), read("drizzle.config.ts"), read(".github/workflows/daily-optimization.yml")]);
  assert.match(render, /runtime: node/);
  assert.match(render, /plan: free/);
  assert.match(render, /startCommand: npm start/);
  assert.match(drizzle, /DIRECT_DATABASE_URL/);
  assert.match(workflow, /api\/cron\/optimize/);
  assert.match(workflow, /secrets\.CRON_SECRET/);
});

test("uses the public checkout origin and keeps optimization reruns bounded", async () => {
  const [checkout, repository] = await Promise.all([
    read("app/api/checkout/route.ts"),
    read("app/lib/repository.ts"),
  ]);
  assert.match(checkout, /process\.env\.NEXT_PUBLIC_SITE_URL/);
  assert.match(repository, /const remainingSlots = Math\.max\(0, 5 - Number/);
  assert.match(repository, /created < remainingSlots/);
});

test("ships a guarded end-to-end voice workflow", async () => {
  const [retell, voiceAi, activation, pause, booking, webhook, admin, runbook] = await Promise.all([
    read("app/lib/retell.ts"),
    read("app/lib/voice-ai.ts"),
    read("app/api/admin/voice/activate/route.ts"),
    read("app/api/admin/voice/pause/route.ts"),
    read("app/api/voice/tools/booking/route.ts"),
    read("app/api/webhooks/retell/route.ts"),
    read("app/components/VoiceAdmin.tsx"),
    read("GO_LIVE.md"),
  ]);
  assert.match(retell, /verifyRetellSignature/);
  assert.match(retell, /inbound_agents/);
  assert.match(retell, /latest_published/);
  assert.match(voiceAi, /Replies in English/);
  assert.match(activation, /setRetellPhoneActive/);
  assert.match(pause, /setRetellPhoneActive/);
  assert.match(booking, /confirmed/);
  assert.match(webhook, /x-retell-signature/);
  assert.match(admin, /Automatico: Italiano \+ English/);
  assert.match(runbook, /Metti in pausa/);
});
