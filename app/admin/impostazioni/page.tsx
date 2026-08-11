import type { Metadata } from "next";
import { AdminSettings } from "../../components/AdminSettings";
import { requireAdmin } from "../../lib/auth";
import { getOrganizationSettings } from "../../lib/repository";
export const metadata: Metadata = { title: "Impostazioni operative", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function SettingsPage() { const session = await requireAdmin(); const data = await getOrganizationSettings(session.organizationId); return <AdminSettings organization={data.organization} integrations={data.integrations} mode={data.mode} />; }
