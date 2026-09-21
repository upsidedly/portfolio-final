"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { formatLabel } from "~/lib/tools/formats";

export function ToolHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="tool-heading">
      <Link href="/tools" className="back-link">
        ← Tools
      </Link>
      <h1>{title}</h1>
      <p className="tool-description">{description}</p>
    </div>
  );
}

export function fileSize(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function FilePicker({
  file,
  accept,
  label,
  onFile,
  disabled,
}: {
  file: File | null;
  accept?: string;
  label: string;
  onFile: (file: File) => void;
  disabled: boolean;
}) {
  const id = useId();
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  function choose(files: FileList | null) {
    setError("");
    if (!files?.length) return;
    if (files.length > 1) {
      setError("Choose one file at a time.");
      return;
    }
    const next = files[0];
    if (next) onFile(next);
  }
  return (
    <div
      className={`file-picker${dragging ? "is-dragging" : ""}`}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (!disabled) choose(event.dataTransfer.files);
      }}
    >
      <div className="file-info">
        {file ? (
          <>
            <span className="file-name">{file.name}</span>
            <span className="quiet">{fileSize(file.size)}</span>
          </>
        ) : (
          <>
            <span>Drop a file here</span>
            <span className="quiet">or choose one from your device</span>
          </>
        )}
      </div>
      <label
        htmlFor={id}
        className={`file-button${disabled ? "disabled" : ""}`}
      >
        {file ? "Change file" : label}
        <input
          id={id}
          type="file"
          accept={accept}
          disabled={disabled}
          onChange={(event) => {
            choose(event.target.files);
            event.target.value = "";
          }}
        />
      </label>
      {error && (
        <p role="alert" className="tool-error">
          {error}
        </p>
      )}
    </div>
  );
}

export function useObjectUrl(blob: Blob | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!blob) {
      setUrl(null);
      return;
    }
    const next = URL.createObjectURL(blob);
    setUrl(next);
    return () => {
      URL.revokeObjectURL(next);
    };
  }, [blob]);
  return url;
}

export function PreferenceNote({
  state,
}: {
  state: "loading" | "ready" | "saving" | "unavailable";
}) {
  return (
    <p className="preference-note" role="status">
      {state === "unavailable"
        ? "Browser storage is unavailable. Settings last for this visit."
        : state === "saving"
          ? "Saving settings…"
          : state === "loading"
            ? "Loading your settings…"
            : "Settings remembered on this browser."}
    </p>
  );
}

export type ToolResult = { blob: Blob; name: string; format: string };

export function Result({ result }: { result: ToolResult }) {
  const url = useObjectUrl(result.blob);
  const [text, setText] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    setPreviewError(false);
    if (["txt", "md", "csv", "json", "srt", "vtt"].includes(result.format)) {
      let active = true;
      void result.blob
        .slice(0, 100_000)
        .text()
        .then((value) => {
          if (active) setText(value);
        });
      return () => {
        active = false;
      };
    }
  }, [result]);
  const audio = [
    "mp3",
    "wav",
    "flac",
    "ogg",
    "ogg-opus",
    "opus",
    "m4a",
    "aac",
    "aiff",
  ].includes(result.format);
  const video = [
    "mp4",
    "mov",
    "webm",
    "mkv",
    "m4v",
    "avi",
    "mpeg",
    "mpg",
  ].includes(result.format);
  const picture = ["jpg", "jpeg", "png", "webp", "gif"].includes(result.format);
  return (
    <section className="tool-result" aria-label="Converted file">
      <div className="result-header">
        <h2 ref={heading} tabIndex={-1}>
          Ready
        </h2>
        <span className="quiet">{fileSize(result.blob.size)}</span>
      </div>
      {url && (
        <>
          {audio && (
            <audio
              controls
              preload="metadata"
              src={url}
              aria-label="Converted audio"
              onError={() => setPreviewError(true)}
            />
          )}
          {video && (
            <video
              controls
              playsInline
              preload="metadata"
              src={url}
              aria-label="Converted video"
              onError={() => setPreviewError(true)}
            />
          )}
          {picture && (
            // Local Blob previews never go through Next's server image optimizer.
            // eslint-disable-next-line @next/next/no-img-element
            <img className="image-preview" src={url} alt="Converted image" />
          )}
          {result.format === "pdf" && (
            <iframe className="pdf-preview" title="Converted PDF" src={url} />
          )}
          {["txt", "md", "csv", "json", "srt", "vtt"].includes(
            result.format,
          ) && (
            <>
              <pre className="text-preview">{text}</pre>
              {result.blob.size > 100_000 && (
                <p className="quiet">
                  Preview shows the first 100 KB. Download includes the whole
                  file.
                </p>
              )}
            </>
          )}
          {previewError && (
            <p className="quiet">
              This browser can’t play this format. Download it to open in a
              compatible player.
            </p>
          )}
          {result.format === "pdf" && (
            <p className="quiet">
              If your browser can’t display the PDF, download it to view.
            </p>
          )}
          <div className="download-row">
            <span className="file-name quiet">{result.name}</span>
            <a className="primary-button" href={url} download={result.name}>
              Download {formatLabel(result.format)}{" "}
              <span aria-hidden="true">↓</span>
            </a>
          </div>
        </>
      )}
    </section>
  );
}
