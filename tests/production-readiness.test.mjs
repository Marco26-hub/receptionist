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

