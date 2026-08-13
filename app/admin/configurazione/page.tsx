import type { Metadata } from "next";
import { OnboardingAdmin } from "../../components/OnboardingAdmin";
import { requireAdmin } from "../../lib/auth";
import { getOnboardingData } from "../../lib/repository";

export const metadata: Metadata = { title: "Configurazione assistita", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const session = await requireAdmin();
  return <OnboardingAdmin data={await getOnboardingData(session.organizationId)} />;
}
