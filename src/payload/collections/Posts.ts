import {
  createServerFeature,
  lexicalEditor,
} from "@payloadcms/richtext-lexical";
import { type CollectionConfig, type FieldHook, slugField } from "payload";

import { isAdmin } from "~/payload/access/isAdmin";

const setPublishedAt: FieldHook = ({ siblingData, value }) => {
  if (siblingData._status === "published" && !value) {
    return new Date().toISOString();
  }

  return typeof value === "string" ? value : null;
};

const WritingToolbarFeature = createServerFeature({
  key: "writingToolbar",
  feature: {
    ClientFeature:
      "~/payload/components/WritingToolbar#WritingToolbarFeatureClient",
  },
});

export const Posts: CollectionConfig = {
  slug: "posts",
  labels: {
    singular: "Musing",
    plural: "Musings",
  },
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: ({ req }) => {
      if (req.user) return true;

      return {
        _status: {
          equals: "published",
        },
      };
    },
    update: isAdmin,
  },
  admin: {
    defaultColumns: ["title", "slug", "_status", "publishedAt"],
    preview: (doc) =>
      typeof doc.slug === "string"
        ? `/preview?slug=${encodeURIComponent(doc.slug)}`
        : null,
    useAsTitle: "title",
  },
  defaultSort: "-publishedAt",
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
      admin: {
        className: "post-title-field",
        placeholder: "Title",
      },
    },
    {
      type: "tabs",
      tabs: [
        {
          label: "Write",
          fields: [
            {
              name: "content",
              type: "richText",
              required: true,
              editor: lexicalEditor({
                features: ({ defaultFeatures }) => [
                  ...defaultFeatures,
                  WritingToolbarFeature(),
                ],
                admin: {
                  hideGutter: true,
                  hideInsertParagraphAtEnd: true,
                  placeholder: "Start writing…",
                },
              }),
              admin: {
                className: "post-content-editor",
                components: {
                  afterInput: ["~/payload/components/WritingStats"],
                },
              },
            },
          ],
        },
        {
          label: "Details",
          description:
            "Add the summary and image used on blog listing and sharing surfaces.",
          fields: [
            {
              name: "excerpt",
              type: "textarea",
              required: true,
              maxLength: 320,
              admin: {
                description:
                  "A short introduction shown in the musings list and link previews.",
              },
            },
            {
              name: "featuredImage",
              type: "upload",
              relationTo: "media",
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
      name: "publishedAt",
      type: "date",
      admin: {
        date: {
          pickerAppearance: "dayAndTime",
        },
        position: "sidebar",
      },
      hooks: {
        beforeChange: [setPublishedAt],
      },
    },
  ],
  versions: {
    drafts: {
      autosave: true,
    },
    maxPerDoc: 50,
  },
};
