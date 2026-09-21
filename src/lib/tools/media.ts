import { mimeForFormat, outputExtension } from "./formats";
import type { FFmpeg } from "@ffmpeg/ffmpeg";

export const MAX_MEDIA_FILE_BYTES = 256 * 1024 * 1024;

const AUDIO_OUTPUTS = new Set([
  "mp3",
  "wav",
  "flac",
  "m4a",
  "aac",
  "ogg",
  "ogg-opus",
  "opus",
  "aiff",
]);
const VIDEO_OUTPUTS = new Set([
  "mp4",
  "mov",
  "webm",
  "mkv",
  "avi",
  "mpeg",
  "mpg",
  "m4v",
  "gif",
]);
const SUBTITLE_OUTPUTS = new Set(["srt", "vtt"]);

export const FFMPEG_RUNTIME = {
  coreURL: "/tool-runtime/ffmpeg-core.js",
  wasmURL: "/tool-runtime/ffmpeg-core.wasm",
  classWorkerURL: "/tool-runtime/worker.js",
} as const;

export type MediaConversionOptions = {
  rate?: number;
  videoSize?: { width: number; height: number };
  signal?: AbortSignal;
  onStatus?: (message: string) => void;
};

export type MediaCommandOptions = {
  hasAudio?: boolean;
  hasVideo?: boolean;
  sourceSampleRate?: number;
  rate?: number;
  videoSize?: { width: number; height: number };
};

const DEFAULT_AUDIO_VIDEO_SIZE = { width: 1280, height: 720 } as const;

function videoSize(options: MediaCommandOptions): {
  width: number;
  height: number;
} {
  const size = options.videoSize ?? DEFAULT_AUDIO_VIDEO_SIZE;
  if (
    !Number.isInteger(size.width) ||
    !Number.isInteger(size.height) ||
    size.width < 16 ||
    size.height < 16 ||
    size.width > 3840 ||
    size.height > 3840 ||
    size.width % 2 !== 0 ||
    size.height % 2 !== 0 ||
    size.width * size.height > 8_294_400
  ) {
    throw new Error(
      "Video dimensions must be even integers from 16 to 3840 with at most 8.3 megapixels.",
    );
  }
  return size;
}

function normalizedFormat(format: string): string {
  return format.trim().toLowerCase().replace(/^\./, "");
}

function assertRate(rate: number): void {
  if (!Number.isFinite(rate) || rate < 0.5 || rate > 2) {
    throw new Error("Speed must be between 0.50× and 2.00×.");
  }
}

function audioFilter(options: MediaCommandOptions): string | undefined {
  const rate = options.rate ?? 1;
  if (rate === 1) return undefined;
  const sourceRate = options.sourceSampleRate;
  if (!sourceRate || !Number.isInteger(sourceRate) || sourceRate <= 0) {
    throw new Error("The source audio sample rate could not be determined.");
  }
  const targetRate = Math.max(1, Math.round(sourceRate * rate));
  // asetrate changes both speed and pitch. aresample brings the stream back
  // to the source rate with a high quality windowed-sinc resampler.
  return `asetrate=${targetRate},aresample=sample_rate=${sourceRate}:filter_size=128:phase_shift=10:exact_rational=1`;
}

function appendAudioCodec(args: string[], format: string): void {
  switch (format) {
    case "mp3":
      args.push("-c:a", "libmp3lame", "-b:a", "320k");
      break;
    case "wav":
      args.push("-c:a", "pcm_s24le");
      break;
    case "flac":
      args.push(
        "-c:a",
        "flac",
        "-sample_fmt",
        "s32",
        "-bits_per_raw_sample",
        "24",
      );
      break;
    case "m4a":
      args.push("-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart");
      break;
    case "aac":
      args.push("-c:a", "aac", "-b:a", "256k", "-f", "adts");
      break;
    case "ogg":
      args.push("-c:a", "libvorbis", "-q:a", "8");
      break;
    case "opus":
      args.push("-c:a", "libopus", "-b:a", "192k");
      break;
    case "ogg-opus":
      args.push("-c:a", "libopus", "-b:a", "192k", "-f", "ogg");
      break;
    case "aiff":
      args.push("-c:a", "pcm_s24be");
      break;
    default:
      throw new Error(`Audio output .${format} is not supported.`);
  }
}

function appendVideoCodec(args: string[], format: string): void {
  switch (format) {
    case "mp4":
    case "mov":
    case "m4v":
      args.push(
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "18",
        "-vf",
        "scale=ceil(iw/2)*2:ceil(ih/2)*2,format=yuv420p",
        "-c:a",
        "aac",
        "-b:a",
        "256k",
      );
      if (format !== "mov") args.push("-movflags", "+faststart");
      break;
    case "webm":
      args.push(
        "-c:v",
        "libvpx",
        "-crf",
        "10",
        "-b:v",
        "0",
        "-c:a",
        "libopus",
        "-b:a",
        "192k",
      );
      break;
    case "mkv":
      args.push("-c:v", "libx264", "-crf", "18", "-c:a", "aac", "-b:a", "256k");
      break;
    case "avi":
      args.push("-c:v", "mpeg4", "-q:v", "2", "-c:a", "mp3", "-b:a", "320k");
      break;
    case "mpeg":
    case "mpg":
      args.push(
        "-c:v",
        "mpeg2video",
        "-q:v",
        "2",
        "-c:a",
        "mp2",
        "-b:a",
        "384k",
      );
      break;
    default:
      throw new Error(`Video output .${format} is not supported.`);
  }
}

/** Build the deterministic FFmpeg arguments used by convertMedia. */
export function buildMediaCommand(
  inputPath: string,
  outputPath: string,
  format: string,
  options: MediaCommandOptions = {},
): string[] {
  assertRate(options.rate ?? 1);
  const target = normalizedFormat(format);
  const args = ["-i", inputPath];

  if (AUDIO_OUTPUTS.has(target)) {
    if (options.hasAudio === false)
      throw new Error("The source has no audio stream.");
    args.push("-map", "0:a:0", "-vn");
    const filter = audioFilter(options);
    if (filter) args.push("-filter:a", filter);
    appendAudioCodec(args, target);
    args.push(outputPath);
    return args;
  }

  if (SUBTITLE_OUTPUTS.has(target)) {
    args.push("-map", "0:s:0");
    args.push("-c:s", target === "vtt" ? "webvtt" : "srt", outputPath);
    return args;
  }

  if (target === "gif") {
    if (options.hasVideo === false)
      throw new Error("The source has no video stream.");
    args.push(
      "-filter_complex",
      "[0:v]split[v0][v1];[v0]palettegen=stats_mode=diff[p];[v1][p]paletteuse",
      "-an",
      outputPath,
    );
    return args;
  }

  if (VIDEO_OUTPUTS.has(target)) {
    const audioOnlyMp4 =
      target === "mp4" &&
      options.hasAudio === true &&
      options.hasVideo === false;
    if (options.hasVideo === false && !audioOnlyMp4)
      throw new Error("The source has no video stream.");
    if (audioOnlyMp4) {
      const size = videoSize(options);
      const filter = audioFilter(options);
      return [
        "-f",
        "lavfi",
        "-i",
        `color=c=black:s=${size.width}x${size.height}:r=24`,
        "-i",
        inputPath,
        "-map",
        "0:v:0",
        "-map",
        "1:a:0",
        ...(filter ? ["-filter:a", filter] : []),
        "-c:v",
        "libx264",
        "-tune",
        // Disable encoder lookahead so -shortest does not leave a silent tail.
        "stillimage,zerolatency",
        "-preset",
        "fast",
        "-crf",
        "18",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-b:a",
        "320k",
        "-shortest",
        "-movflags",
        "+faststart",
        outputPath,
      ];
    }
    args.push("-map", "0:v:0", "-map", "0:a:0?");
    appendVideoCodec(args, target);
    args.push(outputPath);
    return args;
  }

  throw new Error(`Output format .${target} is not supported.`);
}

function abortError(): Error {
  if (typeof DOMException !== "undefined")
    return new DOMException("The conversion was cancelled.", "AbortError");
  const error = new Error("The conversion was cancelled.");
  error.name = "AbortError";
  return error;
}

function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) throw abortError();
}

function randomToken(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID().replaceAll("-", "");
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
}

type ProbeResult = {
  hasAudio: boolean;
  hasVideo: boolean;
  hasSubtitle: boolean;
  sampleRate?: number;
};

async function probeMedia(
  ffmpeg: FFmpeg,
  inputPath: string,
  probePath: string,
  signal: AbortSignal | undefined,
): Promise<ProbeResult> {
  throwIfAborted(signal);
  const status = await ffmpeg.ffprobe(
    [
      "-v",
      "error",
      "-show_entries",
      "stream=codec_type,sample_rate:stream_disposition=attached_pic",
      "-of",
      "json",
      inputPath,
      "-o",
      probePath,
    ],
    120_000,
    { signal },
  );
  // Core 0.12.10 leaves ret at -1 after successful ffprobe runs. Validate its
  // written JSON and stream metadata as well as rejecting explicit failures.
  if (status !== 0 && status !== -1)
    throw new Error("FFmpeg could not inspect this media file.");
  const raw = await ffmpeg.readFile(probePath, "utf8", { signal });
  const jsonText =
    typeof raw === "string" ? raw : new TextDecoder().decode(raw);
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("FFmpeg returned invalid media metadata.");
  }
  const streams =
    parsed &&
    typeof parsed === "object" &&
    Array.isArray((parsed as { streams?: unknown }).streams)
      ? (parsed as { streams: unknown[] }).streams
      : [];
  const audioStream = streams.find(
    (stream): stream is { codec_type: string; sample_rate?: string | number } =>
      !!stream &&
      typeof stream === "object" &&
      (stream as { codec_type?: unknown }).codec_type === "audio",
  );
  const hasAudio = Boolean(audioStream);
  const hasVideo = streams.some((stream) => {
    if (
      !stream ||
      typeof stream !== "object" ||
      (stream as { codec_type?: unknown }).codec_type !== "video"
    )
      return false;
    const attachedPic = (stream as { disposition?: { attached_pic?: unknown } })
      .disposition?.attached_pic;
    return attachedPic !== 1 && attachedPic !== "1" && attachedPic !== true;
  });
  const hasSubtitle = streams.some(
    (stream) =>
      !!stream &&
      typeof stream === "object" &&
      (stream as { codec_type?: unknown }).codec_type === "subtitle",
  );
  let sampleRate: number | undefined;
  if (audioStream) {
    const parsedRate = Number(audioStream.sample_rate);
    if (
      !Number.isFinite(parsedRate) ||
      parsedRate <= 0 ||
      parsedRate > 384000
    ) {
      throw new Error("The source audio sample rate could not be determined.");
    }
    sampleRate = Math.round(parsedRate);
  }
  return {
    hasAudio,
    hasVideo,
    hasSubtitle,
    ...(sampleRate ? { sampleRate } : {}),
  };
}

/** Convert media in a dedicated lazy-loaded FFmpeg worker. */
export async function convertMedia(
  file: File,
  format: string,
  options: MediaConversionOptions = {},
): Promise<Blob> {
  const task = new AbortController();
  const signal = task.signal;
  const cancel = () => task.abort();
  throwIfAborted(options.signal);
  const target = normalizedFormat(format);
  const report = (message: string) => options.onStatus?.(message);
  throwIfAborted(signal);
  if (file.size > MAX_MEDIA_FILE_BYTES)
    throw new Error("Choose a file smaller than 256 MB.");
  if (!file.size) throw new Error("This file is empty. Choose another file.");
  const rate = options.rate ?? 1;
  assertRate(rate);
  const videoSizeOption = options.videoSize;
  if (videoSizeOption) videoSize({ videoSize: videoSizeOption });

  const source = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const token = randomToken();
  const inputPath = `input-${token}.${source.replace(/[^a-z0-9]/g, "") || "bin"}`;
  const outputPath = `output-${token}.${outputExtension(target)}`;
  const probePath = `probe-${token}.json`;
  let ffmpeg: FFmpeg | undefined;
  let timedOut = false;
  const terminate = () => ffmpeg?.terminate();
  signal.addEventListener("abort", terminate, { once: true });
  const timeout = () => {
    timedOut = true;
    task.abort();
  };
  let timer = setTimeout(timeout, 120_000);
  options.signal?.addEventListener("abort", cancel, { once: true });

  try {
    report("Loading conversion engine…");
    const ffmpegModule = await import("@ffmpeg/ffmpeg");
    throwIfAborted(signal);
    ffmpeg = new ffmpegModule.FFmpeg();
    // Absolute URLs remain correct when a bundler rewrites import.meta.url.
    const runtime = {
      coreURL: new URL(FFMPEG_RUNTIME.coreURL, window.location.href).href,
      wasmURL: new URL(FFMPEG_RUNTIME.wasmURL, window.location.href).href,
      classWorkerURL: new URL(
        FFMPEG_RUNTIME.classWorkerURL,
        window.location.href,
      ).href,
    };
    await ffmpeg.load(runtime, { signal });
    clearTimeout(timer);
    timer = setTimeout(timeout, 600_000);
    throwIfAborted(signal);
    report("Inspecting media…");
    await ffmpeg.writeFile(
      inputPath,
      new Uint8Array(await file.arrayBuffer()),
      { signal },
    );
    const probe = await probeMedia(ffmpeg, inputPath, probePath, signal);
    if (AUDIO_OUTPUTS.has(target) && !probe.hasAudio) {
      throw new Error("This file has no audio stream to convert.");
    }
    const audioOnlyMp4 = target === "mp4" && probe.hasAudio && !probe.hasVideo;
    if (VIDEO_OUTPUTS.has(target) && !probe.hasVideo && !audioOnlyMp4) {
      throw new Error("This file has no video stream to convert.");
    }
    if (SUBTITLE_OUTPUTS.has(target) && !probe.hasSubtitle)
      throw new Error("This file has no subtitle stream to convert.");

    report("Converting media…");
    const useRemux =
      (target === "mp4" || target === "mov") && rate === 1 && !audioOnlyMp4;
    let result = -1;
    if (useRemux) {
      result = await ffmpeg.exec(
        ["-i", inputPath, "-map", "0", "-c", "copy", outputPath],
        600_000,
        { signal },
      );
    }
    if (!useRemux || result !== 0) {
      const args = buildMediaCommand(inputPath, outputPath, target, {
        hasAudio: probe.hasAudio,
        hasVideo: probe.hasVideo,
        rate,
        sourceSampleRate: probe.sampleRate,
        videoSize: videoSizeOption,
      });
      result = await ffmpeg.exec(args, 600_000, { signal });
    }
    throwIfAborted(signal);
    if (result !== 0)
      throw new Error("FFmpeg could not encode this output format.");
    const data = await ffmpeg.readFile(outputPath, undefined, { signal });
    throwIfAborted(signal);
    return new Blob([data as BlobPart], { type: mimeForFormat(target) });
  } catch (cause) {
    if (timedOut) throw new Error("Conversion timed out. Try a smaller file.");
    if (signal?.aborted) throw abortError();
    if (cause instanceof Error) throw cause;
    throw new Error("Media conversion failed.");
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", cancel);
    signal.removeEventListener("abort", terminate);
    // Each job owns its worker. Terminating releases the entire virtual FS,
    // including partial output, without queueing cleanup behind a busy encoder.
    ffmpeg?.terminate();
  }
}
