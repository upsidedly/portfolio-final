/** File extensions understood by the browser conversion tools. */

const PLAIN_TEXT_EXTENSIONS = new Set([
  "js",
  "ts",
  "tsx",
  "jsx",
  "json",
  "md",
  "txt",
  "csv",
  "html",
  "css",
  "yaml",
  "yml",
  "xml",
  "py",
  "log",
  "sql",
  "sh",
]);

const IMAGE_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "bmp",
  "avif",
  "gif",
]);

const AUDIO_EXTENSIONS = new Set([
  "mp3",
  "wav",
  "flac",
  "m4a",
  "aac",
  "ogg",
  "opus",
  "aiff",
  "aif",
  "wma",
]);

const VIDEO_EXTENSIONS = new Set([
  "mp4",
  "mov",
  "webm",
  "mkv",
  "avi",
  "mpeg",
  "mpg",
  "m4v",
]);

const SUBTITLE_EXTENSIONS = new Set(["srt", "vtt"]);

/** MIME types for conversion outputs and browser downloads. */
export const mediaMime: Readonly<Record<string, string>> = {
  mp3: "audio/mpeg",
  wav: "audio/wav",
  flac: "audio/flac",
  m4a: "audio/mp4",
  aac: "audio/aac",
  ogg: "audio/ogg",
  "ogg-opus": "audio/ogg; codecs=opus",
  opus: "audio/opus",
  aiff: "audio/aiff",
  aif: "audio/aiff",
  wma: "audio/x-ms-wma",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  mkv: "video/x-matroska",
  avi: "video/x-msvideo",
  mpeg: "video/mpeg",
  mpg: "video/mpeg",
  m4v: "video/x-m4v",
  gif: "image/gif",
  srt: "application/x-subrip",
  vtt: "text/vtt",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/** A MIME type suitable for a Blob, falling back to an opaque binary type. */
export function mimeForFormat(format: string): string {
  const normalized = format.trim().toLowerCase().replace(/^\./, "");
  return mediaMime[normalized] ?? "application/octet-stream";
}

/** Codec variants keep a separate selection but use the container's extension. */
export function outputExtension(format: string): string {
  const normalized = format.trim().toLowerCase().replace(/^\./, "");
  return normalized === "ogg-opus" ? "ogg" : normalized;
}

export function formatLabel(format: string): string {
  return format === "ogg-opus" ? "OGG (OPUS)" : format.toUpperCase();
}

/** Return the final, lower-case extension without its leading dot. */
export function extension(name: string): string {
  const basename = name.split(/[\\/]/).pop() ?? name;
  const dot = basename.lastIndexOf(".");
  if (dot <= 0 || dot === basename.length - 1) return "";
  return basename.slice(dot + 1).toLowerCase();
}

/** Replace the final extension while preserving the original base name. */
export function outputName(name: string, format: string): string {
  const normalized = outputExtension(format);
  const base = name.replace(/[\\/]?[^\\/]*$/, (last) => {
    const dot = last.lastIndexOf(".");
    return dot > 0 ? last.slice(0, dot) : last;
  });
  return `${base}.${normalized}`;
}

function withoutSource(formats: readonly string[], source: string): string[] {
  const sourceFormat = source === "jpeg" ? "jpg" : source;
  return formats.filter((format) => format !== sourceFormat);
}

/**
 * List safe, useful destinations for a file. The list describes the UI
 * contract; media.ts still validates the stream types reported by ffprobe.
 */
export function conversionTargets(filename: string): string[] {
  const source = extension(filename);

  if (PLAIN_TEXT_EXTENSIONS.has(source)) {
    if (source === "txt") return ["md"];
    if (source === "csv") return ["json", "txt"];
    if (source === "json") return ["csv", "txt"];
    return ["txt"];
  }

  if (IMAGE_EXTENSIONS.has(source)) {
    return withoutSource(["jpg", "png", "webp"], source);
  }

  if (AUDIO_EXTENSIONS.has(source)) {
    return withoutSource(
      [
        "mp3",
        "wav",
        "flac",
        "m4a",
        "aac",
        "ogg",
        "ogg-opus",
        "opus",
        "aiff",
        "mp4",
      ],
      source,
    );
  }

  if (VIDEO_EXTENSIONS.has(source)) {
    return withoutSource(
      [
        "mp4",
        "mov",
        "webm",
        "mkv",
        "avi",
        "mpeg",
        "mpg",
        "m4v",
        "gif",
        "mp3",
        "wav",
        "flac",
        "m4a",
        "aac",
        "ogg",
        "ogg-opus",
        "opus",
        "aiff",
      ],
      source,
    );
  }

  if (SUBTITLE_EXTENSIONS.has(source)) {
    return withoutSource(["srt", "vtt"], source);
  }

  return [];
}

export const supportedAudioFormats = AUDIO_EXTENSIONS;
export const supportedVideoFormats = VIDEO_EXTENSIONS;
export const supportedSubtitleFormats = SUBTITLE_EXTENSIONS;
