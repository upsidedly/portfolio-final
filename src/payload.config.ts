import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildConfig } from "payload";
import sharp from "sharp";

import { env } from "~/env";
import { ContactMessages } from "~/payload/collections/ContactMessages";
import { Media } from "~/payload/collections/Media";
import { Posts } from "~/payload/collections/Posts";
import { Projects } from "~/payload/collections/Projects";
import { Users } from "~/payload/collections/Users";
import { SiteSettings } from "~/payload/globals/SiteSettings";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    components: {
      beforeDashboard: ["~/payload/components/DashboardHomeLink"],
      beforeLogin: ["~/payload/components/GoogleLogin"],
      graphics: {
        Icon: "~/payload/components/Branding#BrandIcon",
        Logo: "~/payload/components/Branding#BrandLogo",
      },
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      icons: [
        {
          rel: "icon",
          type: "image/png",
          url: "/avatar-rounded.png",
        },
        {
          rel: "apple-touch-icon",
          type: "image/png",
          url: "/avatar-rounded.png",
        },
      ],
      titleSuffix: "– Portfolio CMS",
    },
    user: Users.slug,
  },
  collections: [Projects, Posts, ContactMessages, Media, Users],
  cors: [env.BETTER_AUTH_URL],
  csrf: [env.BETTER_AUTH_URL],
  db: postgresAdapter({
    pool: {
      connectionString: env.DATABASE_URL,
    },
    schemaName: "payload",
  }),
  editor: lexicalEditor(),
  globals: [SiteSettings],
  plugins: [
    vercelBlobStorage({
      addRandomSuffix: true,
      clientUploads: false,
      collections: {
        media: {
          prefix: "media",
        },
      },
      enabled: Boolean(env.BLOB_READ_WRITE_TOKEN),
      token: env.BLOB_READ_WRITE_TOKEN,
    }),
  ],
  secret: env.PAYLOAD_SECRET,
  serverURL: env.BETTER_AUTH_URL,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  upload: {
    limits: {
      fileSize: 4_000_000,
    },
  },
});
