import { ConvertTool } from "~/components/tools/convert-tool";
import { requireToolsOwner } from "~/server/tools/access";

export const metadata = { title: "Convert a file" };

export default async function ConvertPage() {
  const user = await requireToolsOwner();
  return <ConvertTool preferenceKey={`convert:${user.id}`} />;
}
