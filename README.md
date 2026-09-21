# Portfolio

A dark, editorial portfolio and collection of musings built with Next.js, Payload CMS, Neon,
Better Auth, and Vercel Blob.

## Local development

Copy the variables from `.env.example` into `.env`, then run:

```bash
bun install
bun run db:push
bun run dev
```

The portfolio is available at `http://localhost:3002` and Payload is mounted at
`http://localhost:3002/admin`.

The development command uses `PORT`, then the port in `BETTER_AUTH_URL` from
`.env`. An explicit `--port` argument overrides that choice.

## Private tools

Open `/tools`. Every tool page checks a server-side Better Auth session and
requires a verified email matching `PAYLOAD_ADMIN_EMAIL`. Other signed-in
accounts are denied. The private routes have noindex/no-store headers, are
excluded from the sitemap, and use a separate layout without analytics.

Audio speed and file conversion run on the device using browser APIs and a
lazy-loaded, self-hosted FFmpeg WebAssembly worker. Files are never uploaded or
stored by the site. IndexedDB stores only the selected speed/export format and
preferred conversion targets and video dimensions; storage failure does not prevent conversion.

Nightcore is 1.25× (+3.86 semitones); Daycore is 0.80× (−3.86 semitones).
Pitch follows playback speed. Exports use high-quality resampling, 320 kbps MP3
or lossless 24-bit WAV/FLAC. Lossless output cannot recover quality absent from
the source. The browser's live preview is separate from the export resampler.

The converter offers compatible destinations for common audio, video, image,
text/code, data, and subtitle files. It performs real media encoding/remuxing;
text/code-to-TXT preserves the bytes. CSV-to-JSON requires a header row with
unique column names; JSON-to-CSV requires an array of objects. Unsupported
files are reported without renaming them into a fake format. Word/PDF conversion
is intentionally excluded.

OGG uses Vorbis. The separate OGG (OPUS) option encodes Opus at 192 kbps in an
`.ogg` file; OPUS keeps the `.opus` extension. The selected variant is remembered.

Audio → MP4 creates a black H.264 video with the full audio track. Width and
height are editable (default 1280×720); use even dimensions from 16–3840 pixels,
up to 8,294,400 pixels total. Album artwork is ignored.

Both tools work on Vercel: no native executables, upload endpoints, external
conversion services, or cross-origin-isolation headers are required. Dev and
build copy the pinned FFmpeg runtime to `public/tool-runtime/`; these public
code assets contain no user data or credentials, like other JavaScript assets.
Serving the 31 MB runtime as static files avoids Vercel Function response limits.
Keep the existing Vercel variables and `bun run build:vercel` command.

Files are limited to 256 MB (data transformations: 10 MB; decoded images: 40 MP).
Device memory can impose a lower practical limit. Cancellation terminates the
media worker, and navigating away frees its files. Playback support varies by
browser; a completed export can still be downloaded when its codec cannot be
previewed. No conversions or selected files survive a reload.

FFmpeg runtime source and licensing: [ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm),
[FFmpeg](https://ffmpeg.org/legal.html). The wrapper is MIT; the bundled core
includes GPL-licensed codecs. Keep upstream attribution and source availability
with any redistribution.

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
