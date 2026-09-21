# Private tools verification

Release checks on 21 September 2026: prepared from production `main` at
`35df342`. The initial 15.5.18 deployment was cancelled before promotion when
GitHub reported critical framework advisories. The release uses Next.js 15.5.24
and its matching lockfile, including the
[AVIF image-optimization security fix](https://github.com/vercel/next.js/security/advisories/GHSA-2xp9-vwfh-vxw4).
The full build, lint, types, and nine unit tests passed. The production bundle
also passed owner/anonymous access checks, OGG (OPUS) export/playback/preferences,
audio-to-MP4, mobile reflow, and the public-homepage smoke test. Existing live
Google callback configuration and owner-session authentication were verified.

Verified on 20 September 2026 against the working tree based on `5494968`.
Verdict: **ACCEPT** for the implemented scope. No deployment was performed.

Follow-up: **OGG (OPUS) — ACCEPT.** Added a separate 192 kbps Opus export with
the `.ogg` extension, audio preview, and remembered selection. Chromium and
WebKit conversion, playback, download, and IndexedDB restoration passed.
FFprobe confirmed the downloaded container is Ogg and its codec is Opus; the
existing OGG option still produces Vorbis. OGG Vorbis → OGG Opus also passed.
The selector fits at 320/390/1280px and with doubled text at 320px. TypeScript,
ESLint, the nine existing unit tests, formatting, and diff checks passed. No
production rebuild was run for this follow-up; the browser checks used the
development server. Initial WebKit playback verification used a brittle 200 ms
delay; waiting for actual playback progress passed without an application change.

## Scope

Owner-authenticated `/tools`, `/tools/audio`, and `/tools/convert`; a searchable
index; linked audio pitch/speed with Daycore and Nightcore; common media, image,
text/code, data, and subtitle conversions; browser previews/downloads; and
IndexedDB preferences. Audio-to-MP4 includes editable dimensions and a black
background. Word-to-PDF is excluded at the user's request.

## Evidence

| Area | Result |
| --- | --- |
| Production build | `bun run build` completed, including lint, types, static generation, and build traces. |
| Static checks | ESLint, TypeScript, and `git diff --check` passed. |
| Unit tests | Nine passing tests cover real encoder commands, rate/sample-rate handling, video dimensions, supported targets, and CSV/JSON edge cases. |
| Authentication | Anonymous direct navigation redirects on all three private routes; the session API returns 401. A verified non-owner gets 403 and account-switch recovery. Revoking the owner's temporary test session redirects on window focus. |
| Privacy | Server checks exist in both layout and leaf pages. Production responses include noindex, no-store, and frame-denial headers. Tools load without analytics or the media runtime; the latter loads only when converting. |
| Common flows | JS → TXT preserves bytes and downloads; quoted CSV → JSON previews correctly; MP3 → WAV, PNG → JPG, Daycore → FLAC, Nightcore → WAV, MP4 → MOV, and MP4 → WebM completed. |
| Audio quality | A 2-second, 440 Hz source exported at 1.25× has 1.6-second duration and approximately 550 Hz pitch. WAV output is 24-bit, 48 kHz. |
| Audio → video | Browser export of an MP3 with embedded cover art produces 320×240 H.264/AAC MP4. Both streams are 2 seconds; every decoded RGB value in the tested frame is zero. Odd dimensions are rejected. Dimensions and target restore from IndexedDB. Also passed against the production bundle. |
| Browser engines | Chromium, Firefox, and WebKit passed MP3 → WAV, PNG → JPG, and Daycore → FLAC. Chromium and WebKit passed audio → MP4, including WebKit playback. |
| Layout/access | All three pages reflow at 320, 390, 768, 1280, and 1600 CSS pixels. Populated audio and converter controls pass doubled text at 390px. Native controls, keyboard slider, accessible search, skip link, and forced-color rendering were exercised. |
| Recovery | Corrupt media shows an error; cancelling during engine loading ends the job; retry succeeds. Unsupported formats have an explicit recovery path. |
| Existing site | The public homepage renders outside the tools layout in production. |

Browser verification used temporary database sessions with the normal signed
Better Auth cookie; no authentication bypass was added to the application.
All test sessions and the temporary non-owner account were deleted afterward.
Screenshots, downloaded fixtures, and detailed run output were kept locally in
`/tmp/portfolio-tools-verification/`; these are disposable evidence, not a
production dependency.

## Resolved failures

- The pinned FFmpeg core returns `-1` after successful ffprobe runs. The converter
  now validates the written metadata and distinguishes explicit failures.
- VP9 encoding failed in this WASM build. WebM uses its verified VP8/Opus path.
- The initial audio-to-video encoder left a silent video tail. Disabling encoder
  lookahead makes the video stop with the audio; the full audio stream remains.
- MP3 artwork was initially detected as video. Explicit `attached_pic` metadata
  now excludes it from video detection.
- Enlarged audio controls overflowed on mobile. Controls now wrap without
  clipping or hiding horizontal overflow.
- The hidden skip link appeared in full-page captures after scrolling. It now
  uses clipping and becomes visible when focused.

## Limits and environment

- Conversion pairs are intentionally explicit. Arbitrary formats cannot be
  converted just by changing an extension. See the in-page supported list.
- Maximum input is 256 MB; data transformations are 10 MB and decoded images
  40 MP. Device memory, browser codecs, and execution time may impose tighter
  practical limits. Animated-image conversion produces a still first frame.
- User files remain local. Public FFmpeg assets contain executable code only.
  Static delivery avoids Vercel Function response-size limits. A live Vercel
  deployment was not exercised.
- The Mac had under 250 MB of free disk space. Webpack emitted cache-write
  warnings, but the complete production build and production browser checks
  passed. No application checks were disabled.
- Physical devices, assistive screen-reader operation, every possible codec/file
  combination, and field performance metrics were not tested. Browser viewports
  and engine automation are not claims of physical-device coverage.
- The only new lint suppression is the local Blob image preview: server-side
  Next Image optimization cannot consume a browser-only object URL. Design
  scans found no blocking issue; functional text-button underlines and a
  decorative navigation arrow were reviewed as intentional.
