import { AudioTool } from "~/components/tools/audio-tool";
import { requireToolsOwner } from "~/server/tools/access";

export const metadata = { title: "Audio speed" };

export default async function AudioPage() {
  const user = await requireToolsOwner();
  return <AudioTool preferenceKey={`audio:${user.id}`} />;
}
