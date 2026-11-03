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
  const projects = await payload.find({
    collection: "projects",
    depth: 0,
    limit: 1,
    overrideAccess: false,
    where: {
      and: [{ slug: { equals: slug } }, { hidden: { not_equals: true } }],
    },
  });
  const project = projects.docs[0];
  if (!project) return new Response("Project not found", { status: 404 });

  return createSocialImage({
    title: project.title,
    description: project.summary,
    label: "Project",
  });
}
