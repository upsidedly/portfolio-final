import { lexicalEditor } from "@payloadcms/richtext-lexical";
import type { CollectionConfig, FieldHook } from "payload";

import { isAdmin } from "~/payload/access/isAdmin";

const setSubmittedAt: FieldHook = ({ value }) =>
  typeof value === "string" ? value : new Date().toISOString();

export const ContactMessages: CollectionConfig = {
  slug: "contact-messages",
  labels: {
    singular: "Contact message",
    plural: "Contact messages",
  },
  access: {
    create: () => false,
    delete: isAdmin,
    read: isAdmin,
    update: isAdmin,
  },
  admin: {
    defaultColumns: ["email", "name", "read", "submittedAt"],
    group: "Inbox",
    useAsTitle: "email",
  },
  defaultSort: "-submittedAt",
  fields: [
    {
      name: "name",
      type: "text",
      maxLength: 120,
    },
    {
      name: "email",
      type: "email",
      required: true,
    },
    {
      name: "message",
      type: "richText",
      required: true,
      editor: lexicalEditor({
        admin: {
          hideGutter: true,
          hideInsertParagraphAtEnd: true,
        },
      }),
    },
    {
      name: "read",
      type: "checkbox",
      defaultValue: false,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "submittedAt",
      type: "date",
      required: true,
      admin: {
        date: {
          pickerAppearance: "dayAndTime",
        },
        position: "sidebar",
        readOnly: true,
      },
      hooks: {
        beforeChange: [setSubmittedAt],
      },
    },
  ],
};
