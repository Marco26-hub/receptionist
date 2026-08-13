import type { Metadata } from "next";
import { TeamAdmin } from "../../components/TeamAdmin";
import { requireAdmin } from "../../lib/auth";
import { getTeamMembers } from "../../lib/repository";

export const metadata: Metadata = { title: "Team e accessi", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const session = await requireAdmin();
  return <TeamAdmin initialMembers={await getTeamMembers(session.organizationId)} canManage={session.role === "owner"} />;
}
