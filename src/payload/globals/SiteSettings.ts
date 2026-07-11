import type { GlobalConfig } from "payload";

import { isAdmin } from "~/payload/access/isAdmin";
import { DEFAULT_CONTACT_EMAIL, DEFAULT_SOCIAL_LINKS } from "~/site-constants";

export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  access: {
    read: () => true,
    update: isAdmin,
  },
  admin: {
    group: "Portfolio",
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
      defaultValue: "Matthew Williams",
    },
    {
      name: "role",
      type: "text",
      required: true,
      defaultValue: "Engineer and computer scientist",
    },
    {
      name: "introduction",
      type: "textarea",
      required: true,
      defaultValue:
        "I work across AI/ML, software engineering, computer science, robotics, and systems engineering.",
    },
    {
      name: "currentFocus",
      type: "textarea",
      required: true,
      defaultValue:
        "Currently building software, training models, and working on robotics systems.",
    },
    {
      name: "availability",
      type: "text",
      defaultValue: "Available for interesting collaborations.",
    },
    {
      name: "email",
      type: "email",
      defaultValue: DEFAULT_CONTACT_EMAIL,
    },
    {
      name: "socialLinks",
      type: "array",
      defaultValue: DEFAULT_SOCIAL_LINKS.map((link) => ({ ...link })),
      labels: {
        singular: "Social link",
        plural: "Social links",
      },
      fields: [
        {
          name: "label",
          type: "text",
          required: true,
        },
        {
          name: "url",
          type: "text",
          required: true,
        },
      ],
    },
  ],
};
