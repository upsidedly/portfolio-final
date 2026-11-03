import config from "@payload-config";
import { getPayload } from "payload";

import { createSocialImage } from "~/lib/social-image";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const payload = await getPayload({ config });
  const posts = await payload.find({
    collection: "posts",
    depth: 0,
    limit: 1,
    overrideAccess: false,
    where: {
      and: [{ slug: { equals: slug } }, { _status: { equals: "published" } }],
    },
  });
  const post = posts.docs[0];
  if (!post) return new Response("Musing not found", { status: 404 });

  return createSocialImage({
    title: post.title,
    description: post.excerpt,
    label: "Musing",
  });
}
