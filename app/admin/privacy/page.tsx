import type { Metadata } from "next";
import { PrivacyAdmin } from "../../components/PrivacyAdmin";
import { requireAdmin } from "../../lib/auth";
import { getPrivacyAdminData } from "../../lib/privacy-data";

export const metadata: Metadata = { title: "Dati e privacy", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminPrivacyPage() {
  const session = await requireAdmin();
  const data = await getPrivacyAdminData(session.organizationId);
  return <PrivacyAdmin initialData={data} role={session.role} />;
}
