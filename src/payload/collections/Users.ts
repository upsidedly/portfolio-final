import type { CollectionConfig } from "payload";

import { isAdmin } from "~/payload/access/isAdmin";
import { authenticateWithBetterAuth } from "~/payload/auth/betterAuthStrategy";

export const Users: CollectionConfig = {
  slug: "users",
  admin: {
    useAsTitle: "email",
  },
  auth: {
    disableLocalStrategy: true,
    strategies: [
      {
        name: "better-auth",
        authenticate: authenticateWithBetterAuth,
      },
    ],
  },
  access: {
    admin: ({ req }) => Boolean(req.user),
    create: () => false,
    delete: isAdmin,
    read: isAdmin,
    update: isAdmin,
  },
  fields: [
    {
      name: "email",
      type: "email",
      index: true,
      required: true,
      unique: true,
    },
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "betterAuthUserId",
      type: "text",
      index: true,
      unique: true,
      access: {
        update: () => false,
      },
    },
    {
      name: "image",
      type: "text",
      admin: {
        readOnly: true,
      },
    },
  ],
};
