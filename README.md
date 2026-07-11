# Portfolio

A dark, editorial portfolio and collection of musings built with Next.js, Payload CMS, Neon,
Better Auth, and Vercel Blob.

## Local development

Copy the variables from `.env.example` into `.env`, then run:

```bash
bun install
bun run db:push
bun run dev --port 3002
```

The portfolio is available at `http://localhost:3002` and Payload is mounted at
`http://localhost:3002/admin`.

The public contact links include GitHub, X, LinkedIn, and the résumé stored at
`public/matthew-williams-resume.pdf`. They can be replaced from Site settings.

## Content

- **Site settings** controls the name, role, introduction, current focus,
  availability, email, and social links shown on the public site.
- **Projects** controls selected work, project images, ordering, case-study copy,
  technologies, and external links.
- **Musings** supports drafts, autosave, rich-text writing, automatic slugs, and
  real-page previews.
- **Media** uploads to Vercel Blob when `BLOB_READ_WRITE_TOKEN` is present and
  falls back to `public/media` locally.

## Google OAuth

Create a Web application OAuth client in Google Cloud Console and add:

- `http://localhost:3002/api/auth/callback/google`
- `https://your-production-domain.com/api/auth/callback/google`

Only the address in `PAYLOAD_ADMIN_EMAIL` can enter the CMS.

## Vercel

Add the variables from `.env.example` to the Vercel project. Set
`BETTER_AUTH_URL` to the production origin and use `bun run build:vercel` as the
Build Command. Connect a Vercel Blob store to inject `BLOB_READ_WRITE_TOKEN`.

The Payload tables live in the `payload` schema of the configured Neon database.
The current schema has already been pushed during development. For future
production schema changes, create and test Payload migrations against a clean
migration-managed database before changing the Vercel build command.
