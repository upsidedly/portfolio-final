import { redirect } from "next/navigation";
import { getSession } from "~/server/better-auth/server";
import { isToolsOwner } from "~/server/tools/access";
import { ToolsSignIn } from "~/components/tools/sign-in";

export default async function SignInPage() {
  const session = await getSession();
  if (isToolsOwner(session)) redirect("/tools");
  return <ToolsSignIn wrongAccount={Boolean(session)} />;
}
