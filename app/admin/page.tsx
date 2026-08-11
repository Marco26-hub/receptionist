import type { Metadata } from "next";
import { AdminDashboard } from "../components/AdminDashboard";
import { requireAdmin } from "../lib/auth";
import { getDashboardData } from "../lib/repository";
export const metadata: Metadata = { title: "Atelier operativo", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function AdminPage() { const session = await requireAdmin(); const data = await getDashboardData(session.organizationId); return <AdminDashboard initialData={data} userEmail={session.email} />; }
