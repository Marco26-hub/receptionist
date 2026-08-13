import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PlatformAdmin } from "../components/PlatformAdmin";
import { requireAdmin } from "../lib/auth";
import { getPlatformOrganizations, isPlatformAdminEmail, platformProvisioningReady } from "../lib/platform-admin";

export const metadata: Metadata = { title: "Gestione clienti AgendaPiena", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PlatformPage() {
  const session = await requireAdmin();
  if (!isPlatformAdminEmail(session.email)) redirect("/admin");
  return <PlatformAdmin initialOrganizations={await getPlatformOrganizations()} provisioningReady={platformProvisioningReady()} />;
}
