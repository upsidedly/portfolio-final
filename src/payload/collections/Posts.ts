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

const MusingCanvasFeature = createServerFeature({
  key: "musingCanvas",
  feature: {
    ClientFeature:
      "~/payload/components/Musings/Canvas#MusingCanvasFeatureClient",
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
    components: {
      beforeListTable: ["~/payload/components/Musings/List#MusingFilters"],
    },
    defaultColumns: ["title", "_status", "updatedAt"],
    listSearchableFields: ["title", "excerpt"],
    preview: (doc) =>
      typeof doc.slug === "string"
        ? `/preview?slug=${encodeURIComponent(doc.slug)}`
        : null,
    useAsTitle: "title",
  },
  defaultSort: "-updatedAt",
  fields: [
    {
      name: "writingStats",
      type: "ui",
      admin: {
        components: {
          Field: "~/payload/components/WritingStats",
        },
      },
    },
    {
      type: "collapsible",
      label: "Post settings",
      admin: {
        components: {
          Field: "~/payload/components/Musings/Editor#PostSettings",
        },
      },
      fields: [
        {
          name: "excerpt",
          type: "textarea",
          required: true,
          maxLength: 320,
          admin: {
            description:
              "Required to publish. Shown in listings and link previews.",
          },
        },
        {
          name: "featuredImage",
          type: "upload",
          relationTo: "media",
        },
        slugField({ position: "main", useAsSlug: "title" }),
        {
          name: "publishedAt",
          label: "Publication date",
          type: "date",
          admin: {
            date: {
              pickerAppearance: "dayAndTime",
            },
            description: "Leave empty to use the publish date.",
          },
          hooks: {
            beforeChange: [setPublishedAt],
          },
        },
      ],
    },
    {
      name: "title",
      type: "text",
      required: true,
      admin: {
        className: "musing-title",
        placeholder: "Title",
        components: {
          Cell: "~/payload/components/Musings/List#MusingTitleCell",
        },
      },
    },
    {
      name: "content",
      type: "richText",
      required: true,
      editor: lexicalEditor({
        admin: {
          hideGutter: true,
          hideInsertParagraphAtEnd: true,
          placeholder: "Start writing",
        },
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          MusingCanvasFeature(),
        ],
      }),
      admin: {
        className: "musing-content",
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
