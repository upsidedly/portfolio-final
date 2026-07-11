import type { CollectionConfig } from "payload";

import { isAdmin } from "~/payload/access/isAdmin";

export const Media: CollectionConfig = {
  slug: "media",
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: () => true,
    update: isAdmin,
  },
  admin: {
    useAsTitle: "alt",
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
    },
  ],
  upload: {
    focalPoint: true,
    imageSizes: [
      {
        name: "thumbnail",
        width: 480,
        height: 320,
        position: "centre",
      },
      {
        name: "card",
        width: 960,
        height: 640,
        position: "centre",
      },
      {
        name: "hero",
        width: 1600,
        height: 900,
        position: "centre",
      },
    ],
    mimeTypes: ["image/*"],
    staticDir: "public/media",
  },
};
