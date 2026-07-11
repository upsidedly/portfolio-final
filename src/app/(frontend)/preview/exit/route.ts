import { draftMode } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  const draft = await draftMode();
  draft.disable();

  return NextResponse.redirect(
    new URL(slug ? `/blog/${encodeURIComponent(slug)}` : "/", request.url),
  );
}
