import config from "@payload-config";
import type { MetadataRoute } from "next";
import { getPayload } from "payload";

import { SITE_ORIGIN } from "~/seo";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayload({ config });
  const [posts, projects] = await Promise.all([
    payload.find({
      collection: "posts",
      limit: 1000,
      select: {
        slug: true,
        updatedAt: true,
      },
      where: { _status: { equals: "published" } },
    }),
    payload.find({
      collection: "projects",
      limit: 1000,
      select: {
        slug: true,
        updatedAt: true,
      },
    }),
  ]);

  return [
    {
      changeFrequency: "monthly",
      priority: 1,
      url: SITE_ORIGIN.toString(),
    },
    {
      changeFrequency: "weekly",
      priority: 0.7,
      url: new URL("/blog", SITE_ORIGIN).toString(),
    },
    {
      changeFrequency: "yearly",
      priority: 0.4,
      url: new URL("/contact", SITE_ORIGIN).toString(),
    },
    ...posts.docs.flatMap((post) =>
      post.slug
        ? [
            {
              changeFrequency: "monthly" as const,
              lastModified: post.updatedAt,
              priority: 0.8,
              url: new URL(`/blog/${post.slug}`, SITE_ORIGIN).toString(),
            },
          ]
        : [],
    ),
    ...projects.docs.flatMap((project) =>
      project.slug
        ? [
            {
              changeFrequency: "monthly" as const,
              lastModified: project.updatedAt,
              priority: 0.7,
              url: new URL(`/projects/${project.slug}`, SITE_ORIGIN).toString(),
            },
          ]
        : [],
    ),
  ];
}
