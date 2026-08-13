import type { Metadata } from "next";
import { OrganizationSwitcher } from "../../components/OrganizationSwitcher";
import { requireAdmin } from "../../lib/auth";
import { isPlatformAdminEmail, listUserOrganizations } from "../../lib/platform-admin";

export const metadata: Metadata = { title: "Le tue attività", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function OrganizationsPage() {
  const session = await requireAdmin();
  return <OrganizationSwitcher organizations={await listUserOrganizations(session.email)} currentOrganizationId={session.organizationId} platformAdmin={isPlatformAdminEmail(session.email)} />;
}
