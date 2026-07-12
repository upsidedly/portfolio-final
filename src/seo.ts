import "server-only";

import type { Metadata } from "next";

import { env } from "~/env";
import { SITE_NAME } from "~/site-constants";

export const SITE_ORIGIN = new URL(env.BETTER_AUTH_URL);

type SocialImage = {
  alt: string;
  url: string;
};

type PageMetadataOptions = {
  description: string;
  image?: SocialImage | null;
  path: string;
  publishedTime?: null | string;
  title: string;
  type?: "article" | "website";
};

export function createPageMetadata({
  description,
  image,
  path,
  publishedTime,
  title,
  type = "website",
}: PageMetadataOptions): Metadata {
  const url = new URL(path, SITE_ORIGIN);
  const images = image ? [{ alt: image.alt, url: image.url }] : undefined;
  const openGraphBase = {
    description,
    images,
    locale: "en_US",
    siteName: SITE_NAME,
    title,
    url,
  };

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph:
      type === "article"
        ? {
            ...openGraphBase,
            authors: [SITE_NAME],
            publishedTime: publishedTime ?? undefined,
            type: "article",
          }
        : {
            ...openGraphBase,
            type: "website",
          },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      description,
      images: image ? [image.url] : undefined,
      title,
    },
  };
}
