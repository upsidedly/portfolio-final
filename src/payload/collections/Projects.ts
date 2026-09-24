import { lexicalEditor } from "@payloadcms/richtext-lexical";
import {
  type CollectionConfig,
  slugField,
  type UploadFieldSingleValidation,
} from "payload";

import { isAdmin } from "~/payload/access/isAdmin";

const validateFeaturedImage: UploadFieldSingleValidation = (
  value,
  { siblingData },
) => {
  const project = siblingData as { featured?: boolean };

  if (project.featured && !value) {
    return "Add an image before featuring this project.";
  }

  return true;
};

export const Projects: CollectionConfig = {
  slug: "projects",
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: ({ req }) =>
      req.user
        ? true
        : {
            hidden: { not_equals: true },
          },
    update: isAdmin,
  },
  admin: {
    defaultColumns: ["title", "hidden", "role", "year", "featured", "order"],
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
              admin: {
                description:
                  "Required for featured projects. Optional for other projects.",
              },
              validate: validateFeaturedImage,
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
      name: "hidden",
      label: "Hide from portfolio",
      type: "checkbox",
      defaultValue: false,
      admin: {
        description:
          "Hide this project from the public portfolio without deleting it.",
        position: "sidebar",
        components: {
          Cell: "~/payload/components/ProjectVisibilityCell",
        },
      },
    },
    {
      name: "featured",
      type: "checkbox",
      defaultValue: true,
      admin: {
        description:
          "Show this project in the Featured Projects gallery. An image is required.",
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
