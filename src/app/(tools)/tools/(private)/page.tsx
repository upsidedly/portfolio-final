import { ToolsIndex } from "~/components/tools/tools-index";
import { requireToolsOwner } from "~/server/tools/access";

export default async function ToolsPage() {
  await requireToolsOwner();
  return <ToolsIndex />;
}
