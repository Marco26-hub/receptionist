import type { Metadata } from "next";
import { VoiceAdmin } from "../../components/VoiceAdmin";
import { requireAdmin } from "../../lib/auth";
import { voiceCategories } from "../../lib/voice-categories";
import { getVoiceAdminData } from "../../lib/voice-repository";

export const metadata: Metadata = { title: "Assistente telefonico", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function VoiceAdminPage() {
  const session = await requireAdmin();
  const data = await getVoiceAdminData(session.organizationId);
  return <VoiceAdmin initialData={data} categories={voiceCategories} />;
}
