import config from "@payload-config";
import { getPayload } from "payload";
import { draftMode } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { env } from "~/env";
import { auth } from "~/server/better-auth";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (
    session?.user.email.toLowerCase() !== env.PAYLOAD_ADMIN_EMAIL.toLowerCase()
  ) {
    return new Response("You are not allowed to preview this post.", {
      status: 403,
    });
  }

  const slug = request.nextUrl.searchParams.get("slug");
  if (!slug) return new Response("Missing post slug.", { status: 400 });

  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: "posts",
    depth: 0,
    draft: true,
    limit: 1,
    overrideAccess: true,
    where: {
      slug: {
        equals: slug,
      },
    },
  });

  if (!result.docs[0]) {
    return new Response("Post not found.", { status: 404 });
  }

  const draft = await draftMode();
  draft.enable();

  return NextResponse.redirect(
    new URL(`/blog/${encodeURIComponent(slug)}`, request.url),
  );
}
