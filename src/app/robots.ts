import type { MetadataRoute } from "next";

import { SITE_ORIGIN } from "~/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    host: SITE_ORIGIN.origin,
    rules: {
      allow: "/",
      disallow: ["/admin", "/api", "/preview"],
      userAgent: "*",
    },
    sitemap: new URL("/sitemap.xml", SITE_ORIGIN).toString(),
  };
}
