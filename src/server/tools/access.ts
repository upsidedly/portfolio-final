import "server-only";

import { redirect } from "next/navigation";
import { env } from "~/env";
import { auth } from "~/server/better-auth";
import { getSession } from "~/server/better-auth/server";

export const privateHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
};

type Identity = { user: { email: string; emailVerified: boolean } } | null;

export function isToolsOwner(session: Identity): boolean {
  return Boolean(
    session?.user.emailVerified &&
    session.user.email.trim().toLowerCase() ===
      env.PAYLOAD_ADMIN_EMAIL.trim().toLowerCase(),
  );
}

export async function requireToolsOwner() {
  const session = await getSession();
  if (!isToolsOwner(session) || !session) redirect("/tools/sign-in");
  return session.user;
}

export async function authorizeToolsRequest(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!isToolsOwner(session)) {
    return Response.json(
      { error: "Owner sign-in required." },
      { status: session ? 403 : 401, headers: privateHeaders },
    );
  }
  return null;
}
