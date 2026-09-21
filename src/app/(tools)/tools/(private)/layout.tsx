import { requireToolsOwner } from "~/server/tools/access";
import { SessionBoundary } from "~/components/tools/session-boundary";

export default async function PrivateToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireToolsOwner();
  return <SessionBoundary>{children}</SessionBoundary>;
}
