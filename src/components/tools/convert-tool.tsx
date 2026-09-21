"use client";

import { useEffect, useRef, useState } from "react";
import {
  conversionTargets,
  extension,
  formatLabel,
  outputName,
  supportedAudioFormats,
} from "~/lib/tools/formats";
import { convertFile } from "~/lib/tools/convert";
import { usePreferences } from "~/lib/tools/preferences";
import { checkToolsSession } from "./session-boundary";
import {
  FilePicker,
  PreferenceNote,
  Result,
  ToolHeading,
  type ToolResult,
} from "./shared";

type VideoSize = { width: number; height: number };
type Preferences = { formats: Record<string, string>; videoSize?: VideoSize };
const defaults: Preferences = { formats: {} };
function validSize(value: unknown): value is VideoSize {
  if (
    !value ||
    typeof value !== "object" ||
    !("width" in value) ||
    !("height" in value)
  )
    return false;
  const { width, height } = value;
  return (
    typeof width === "number" &&
    typeof height === "number" &&
    Number.isInteger(width) &&
    Number.isInteger(height) &&
    width >= 16 &&
    width <= 3840 &&
    height >= 16 &&
    height <= 3840 &&
    width % 2 === 0 &&
    height % 2 === 0 &&
    width * height <= 8_294_400
  );
}
function validPreferences(value: unknown): value is Preferences {
  if (
    !value ||
    typeof value !== "object" ||
    !("formats" in value) ||
    !value.formats ||
    typeof value.formats !== "object"
  )
    return false;
  return (
    (!("videoSize" in value) || validSize(value.videoSize)) &&
    Object.entries(value.formats).length < 100 &&
    Object.entries(value.formats).every(
      ([key, target]) =>
        /^[a-z0-9]+$/.test(key) &&
        typeof target === "string" &&
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(target),
    )
  );
}

export function ConvertTool({ preferenceKey }: { preferenceKey: string }) {
  const {
    value: settings,
    save,
    storage,
  } = usePreferences(preferenceKey, defaults, validPreferences);
  const [file, setFile] = useState<File | null>(null);
  const [selection, setSelection] = useState<string | null>(null);
  const [widthInput, setWidthInput] = useState<string | null>(null);
  const [heightInput, setHeightInput] = useState<string | null>(null);
  const [result, setResult] = useState<ToolResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);
  const source = file ? extension(file.name) : "";
  const targets = file ? conversionTargets(file.name) : [];
  const remembered = settings.formats[source];
  const format =
    selection && targets.includes(selection)
      ? selection
      : remembered && targets.includes(remembered)
        ? remembered
        : (targets[0] ?? "");
  const audioVideo = supportedAudioFormats.has(source) && format === "mp4";
  const width = widthInput ?? String(settings.videoSize?.width ?? 1280);
  const height = heightInput ?? String(settings.videoSize?.height ?? 720);
  useEffect(() => () => controller.current?.abort(), []);

  function choose(next: File) {
    setResult(null);
    setStatus("");
    setError("");
    setSelection(null);
    if (!next.size || next.size > 256 * 1024 * 1024) {
      setError("Choose a non-empty file smaller than 256 MB.");
      return;
    }
    setFile(next);
  }
  async function convert() {
    if (!file || !format || busy) return;
    const videoSize = { width: Number(width), height: Number(height) };
    if (audioVideo && !validSize(videoSize)) {
      setError(
        "Use even dimensions from 16 to 3840 pixels, up to 8.3 megapixels in total.",
      );
      return;
    }
    const task = new AbortController();
    controller.current = task;
    setBusy(true);
    setError("");
    setResult(null);
    setStatus("Checking access…");
    try {
      await checkToolsSession(task.signal);
      const blob = await convertFile(file, format, {
        signal: task.signal,
        onStatus: setStatus,
        ...(audioVideo ? { videoSize } : {}),
      });
      task.signal.throwIfAborted();
      setResult({ blob, format, name: outputName(file.name, format) });
      save({
        ...settings,
        formats: { ...settings.formats, [source]: format },
        ...(audioVideo ? { videoSize } : {}),
      });
      setStatus("Conversion complete.");
    } catch (cause) {
      if (task.signal.aborted)
        setStatus("Cancelled. Your file is still selected.");
      else {
        setError(
          cause instanceof Error
            ? cause.message
            : "Conversion failed. Try another file.",
        );
        setStatus("");
      }
    } finally {
      if (controller.current === task) {
        controller.current = null;
        setBusy(false);
      }
    }
  }
  return (
    <main id="main">
      <ToolHeading
        title="Convert a file"
        description="Change formats. Preview. Download."
      />
      <FilePicker
        file={file}
        label="Choose file"
        onFile={choose}
        disabled={busy}
      />
      {file && targets.length === 0 && (
        <div className="unsupported">
          <p role="status">
            {source
              ? `.${source} conversion isn’t supported yet.`
              : "This file has no recognised extension."}
          </p>
          <p className="quiet">
            Choose an audio, video, image, text, code, or data file. Available
            formats are listed below.
          </p>
        </div>
      )}
      {file && targets.length > 0 && (
        <div className="tool-controls">
          <div className="conversion-format">
            <div>
              <span className="control-label">From</span>
              <span className="source-format">{source.toUpperCase()}</span>
            </div>
            <span aria-hidden="true">→</span>
            <div>
              <label className="control-label" htmlFor="target-format">
                To
              </label>
              <select
                id="target-format"
                disabled={busy}
                value={format}
                onChange={(event) => {
                  setSelection(event.target.value);
                  setResult(null);
                  setStatus("");
                  setError("");
                }}
              >
                {targets.map((target) => (
                  <option value={target} key={target}>
                    {formatLabel(target)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {audioVideo && (
            <fieldset className="video-size" disabled={busy}>
              <legend className="control-label">Video size</legend>
              <label>
                <span className="control-label">Width (px)</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="16"
                  max="3840"
                  step="2"
                  value={width}
                  onChange={(event) => {
                    setWidthInput(event.target.value);
                    setResult(null);
                    setError("");
                    setStatus("");
                  }}
                />
              </label>
              <span aria-hidden="true">×</span>
              <label>
                <span className="control-label">Height (px)</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="16"
                  max="3840"
                  step="2"
                  value={height}
                  onChange={(event) => {
                    setHeightInput(event.target.value);
                    setResult(null);
                    setError("");
                    setStatus("");
                  }}
                />
              </label>
              <p className="quiet">Black background. Your full audio track.</p>
            </fieldset>
          )}
          {format === "txt" && (
            <p className="quiet">
              Keeps the original text and changes its file extension.
            </p>
          )}
          {(source === "gif" || source === "webp") &&
            ["jpg", "png", "webp"].includes(format) && (
              <p className="quiet">
                Creates a still image from the first frame.
              </p>
            )}
          {format === "jpg" && (
            <p className="quiet">Transparent areas become white.</p>
          )}
          {!audioVideo && ["mp4", "mov"].includes(format) && (
            <p className="quiet">
              Keeps the original streams when compatible; otherwise converts for
              playback.
            </p>
          )}
          <div className="action-row">
            <button
              className="primary-button"
              disabled={busy}
              onClick={convert}
            >
              {busy ? "Converting…" : "Convert file"}
            </button>
            {busy && (
              <button
                type="button"
                className="text-button"
                onClick={() => controller.current?.abort()}
              >
                Cancel
              </button>
            )}
          </div>
          <p role="status" className="tool-status">
            {status}
          </p>
        </div>
      )}
      {error && (
        <p className="tool-error" role="alert">
          {error}
        </p>
      )}
      {result && <Result result={result} />}
      <details className="supported-formats">
        <summary>Supported formats</summary>
        <dl>
          <div>
            <dt>Audio</dt>
            <dd>MP3, WAV, FLAC, M4A, AAC, OGG, OGG (OPUS), OPUS, AIFF</dd>
          </div>
          <div>
            <dt>Video</dt>
            <dd>MP4, MOV, WEBM, MKV, AVI, MPEG. Audio → MP4.</dd>
          </div>
          <div>
            <dt>Images</dt>
            <dd>
              JPG, PNG, WEBP. More image formats can be read; choose a file to
              see its destinations.
            </dd>
          </div>
          <div>
            <dt>Text & code</dt>
            <dd>
              JS, TS, JSX, TSX, HTML, CSS, PY, SQL, SH, JSON, CSV, XML, YAML, MD
              → TXT
            </dd>
          </div>
          <div>
            <dt>Data</dt>
            <dd>CSV ↔ JSON</dd>
          </div>
          <div>
            <dt>Subtitles</dt>
            <dd>SRT ↔ VTT</dd>
          </div>
        </dl>
      </details>
      <div className="tool-notes">
        <p>
          Processed on your device. Files aren’t uploaded.
          <br />
          Up to 256 MB. Large videos can take a while.
        </p>
        <PreferenceNote state={storage} />
      </div>
    </main>
  );
}
