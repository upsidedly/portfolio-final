import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { type CollectionConfig, slugField } from "payload";

import { isAdmin } from "~/payload/access/isAdmin";

export const Projects: CollectionConfig = {
  slug: "projects",
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: () => true,
    update: isAdmin,
  },
  admin: {
    defaultColumns: ["title", "role", "year", "featured", "order"],
    useAsTitle: "title",
  },
  defaultSort: "order",
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Project",
          fields: [
            {
              name: "title",
              type: "text",
              required: true,
            },
            {
              name: "summary",
              type: "textarea",
              required: true,
              maxLength: 240,
            },
            {
              name: "description",
              type: "richText",
              editor: lexicalEditor({
                admin: {
                  hideGutter: true,
                  hideInsertParagraphAtEnd: true,
                },
              }),
            },
            {
              name: "image",
              type: "upload",
              relationTo: "media",
            },
          ],
        },
        {
          label: "Details",
          fields: [
            {
              name: "role",
              type: "text",
              required: true,
            },
            {
              name: "year",
              type: "text",
            },
            {
              name: "technologies",
              type: "array",
              fields: [
                {
                  name: "name",
                  type: "text",
                  required: true,
                },
              ],
            },
            {
              name: "projectURL",
              label: "Live project URL",
              type: "text",
            },
            {
              name: "repositoryURL",
              label: "Repository URL",
              type: "text",
            },
          ],
        },
      ],
    },
    slugField({
      position: "sidebar",
      useAsSlug: "title",
    }),
    {
      name: "featured",
      type: "checkbox",
      defaultValue: true,
      admin: {
        description: "Show this project on the home page.",
        position: "sidebar",
      },
    },
    {
      name: "order",
      type: "number",
      defaultValue: 10,
      admin: {
        description: "Lower numbers appear first.",
        position: "sidebar",
        step: 1,
      },
    },
  ],
};
