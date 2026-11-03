import { CorkControls } from "~/components/project-controls/cork-controls";
import { requireToolsOwner } from "~/server/tools/access";

export const metadata = { title: "Cork · Project controls" };
export default async function CorkPage() {
  await requireToolsOwner();
  return <CorkControls />;
}
