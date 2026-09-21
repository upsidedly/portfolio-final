"use client";

import { useEffect, useRef, useState } from "react";
import { usePreferences } from "~/lib/tools/preferences";
import { outputName } from "~/lib/tools/formats";
import { checkToolsSession } from "./session-boundary";
import {
  FilePicker,
  PreferenceNote,
  Result,
  ToolHeading,
  useObjectUrl,
  type ToolResult,
} from "./shared";

type AudioPreferences = { rate: number; format: "mp3" | "wav" | "flac" };
const defaults: AudioPreferences = { rate: 1, format: "mp3" };
function validPreferences(value: unknown): value is AudioPreferences {
  if (!value || typeof value !== "object") return false;
  const data = value as Partial<AudioPreferences>;
  return (
    typeof data.rate === "number" &&
    Number.isFinite(data.rate) &&
    data.rate >= 0.5 &&
    data.rate <= 2 &&
    ["mp3", "wav", "flac"].includes(data.format ?? "")
  );
}

export function AudioTool({ preferenceKey }: { preferenceKey: string }) {
  const {
    value: settings,
    save,
    storage,
  } = usePreferences(preferenceKey, defaults, validPreferences);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ToolResult | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [rateInput, setRateInput] = useState(String(settings.rate));
  const controller = useRef<AbortController | null>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const url = useObjectUrl(file);
  const semitones = 12 * Math.log2(settings.rate);

  useEffect(() => {
    setRateInput(String(settings.rate));
  }, [settings.rate]);
  useEffect(() => {
    if (audio.current) {
      audio.current.preservesPitch = false;
      audio.current.playbackRate = settings.rate;
    }
  }, [settings.rate, url]);
  useEffect(() => () => controller.current?.abort(), []);

  function update(next: AudioPreferences) {
    save(next);
    setResult(null);
    setStatus("");
  }
  function choose(next: File) {
    setError("");
    if (!next.size || next.size > 256 * 1024 * 1024) {
      setError("Choose a non-empty audio file smaller than 256 MB.");
      return;
    }
    setFile(next);
    setResult(null);
    setStatus("");
    setPreviewError(false);
  }
  function commitRate() {
    const rate = Number(rateInput);
    if (!Number.isFinite(rate) || rate < 0.5 || rate > 2) {
      setRateInput(String(settings.rate));
      setError("Speed must be between 0.50× and 2.00×.");
      return;
    }
    setError("");
    update({ ...settings, rate: Math.round(rate * 100) / 100 });
  }
  async function convert() {
    if (!file || busy) return;
    const task = new AbortController();
    controller.current = task;
    setBusy(true);
    setError("");
    setResult(null);
    setStatus("Checking access…");
    audio.current?.pause();
    try {
      await checkToolsSession(task.signal);
      const { convertMedia } = await import("~/lib/tools/media");
      const blob = await convertMedia(file, settings.format, {
        rate: settings.rate,
        signal: task.signal,
        onStatus: setStatus,
      });
      task.signal.throwIfAborted();
      const suffix = settings.rate === 1 ? "" : `-${settings.rate.toFixed(2)}x`;
      setResult({
        blob,
        name: outputName(
          file.name.replace(/\.[^.]+$/, "") + suffix + ".audio",
          settings.format,
        ),
        format: settings.format,
      });
      setStatus("Conversion complete.");
    } catch (cause) {
      if (task.signal.aborted)
        setStatus("Cancelled. Your file is still selected.");
      else {
        setError(
          cause instanceof Error
            ? cause.message
            : "Conversion failed. Try another audio file.",
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
        title="Audio speed"
        description="Pitch and speed, together."
      />
      <FilePicker
        file={file}
        accept="audio/*,.mp3,.wav,.flac,.m4a,.aac,.ogg,.opus,.aiff,.aif,.wma"
        label="Choose audio"
        onFile={choose}
        disabled={busy}
      />
      <div className="tool-controls">
        <fieldset disabled={busy} className="presets">
          <legend className="sr-only">Speed preset</legend>
          {[
            { name: "Daycore", rate: 0.8 },
            { name: "Original", rate: 1 },
            { name: "Nightcore", rate: 1.25 },
          ].map((preset) => (
            <button
              type="button"
              key={preset.name}
              aria-pressed={settings.rate === preset.rate}
              onClick={() => {
                setError("");
                update({ ...settings, rate: preset.rate });
              }}
            >
              {preset.name}
            </button>
          ))}
        </fieldset>
        <div className="speed-control">
          <div className="speed-label">
            <label htmlFor="speed">Speed</label>
            <div className="speed-value">
              <label className="sr-only" htmlFor="speed-number">
                Exact speed
              </label>
              <input
                id="speed-number"
                type="number"
                min="0.5"
                max="2"
                step="0.01"
                value={rateInput}
                disabled={busy}
                onChange={(event) => setRateInput(event.target.value)}
                onBlur={commitRate}
                onKeyDown={(event) => {
                  if (event.key === "Enter") event.currentTarget.blur();
                }}
              />
              <span>×</span>
            </div>
          </div>
          <input
            id="speed"
            type="range"
            min="0.5"
            max="2"
            step="0.01"
            value={settings.rate}
            disabled={busy}
            aria-valuetext={`${settings.rate.toFixed(2)} times speed, ${semitones.toFixed(2)} semitones`}
            onChange={(event) => {
              setError("");
              update({ ...settings, rate: Number(event.target.value) });
            }}
          />
          <div className="range-caption">
            <span>0.50×</span>
            <span>
              {semitones >= 0 ? "+" : ""}
              {semitones.toFixed(2)} semitones
            </span>
            <span>2.00×</span>
          </div>
        </div>
        {url && (
          <div className="audio-preview">
            <span className="control-label">
              Listen at {settings.rate.toFixed(2)}×
            </span>
            <audio
              ref={audio}
              controls
              preload="metadata"
              src={url}
              onLoadedMetadata={() => {
                if (audio.current) {
                  audio.current.preservesPitch = false;
                  audio.current.playbackRate = settings.rate;
                }
              }}
              onError={() => setPreviewError(true)}
              aria-label="Audio preview at selected speed"
            />
            {previewError && (
              <p className="quiet">
                This browser can’t preview the source format. You can still
                convert it.
              </p>
            )}
          </div>
        )}
        <fieldset className="format-control" disabled={busy}>
          <legend>Download format</legend>
          <div className="format-options">
            {(["mp3", "wav", "flac"] as const).map((format) => (
              <label key={format}>
                <input
                  type="radio"
                  name="audio-format"
                  value={format}
                  checked={settings.format === format}
                  onChange={() => update({ ...settings, format })}
                />
                <span>{format.toUpperCase()}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <p className="quality-note">
          {settings.format === "mp3"
            ? "320 kbps MP3"
            : settings.format === "wav"
              ? "24-bit WAV"
              : "24-bit FLAC"}{" "}
          · High-quality resampling.
          <br />
          {settings.format === "mp3"
            ? "For the least loss, choose WAV or FLAC."
            : "Lossless output. Source quality still matters."}
        </p>
        <div className="action-row">
          <button
            className="primary-button"
            disabled={!file || busy}
            onClick={convert}
          >
            {busy ? "Converting…" : "Convert audio"}
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
        {!file && <p className="quiet">Choose audio to get started.</p>}
        <p className="tool-status" role="status">
          {status}
        </p>
        {error && (
          <p className="tool-error" role="alert">
            {error}
          </p>
        )}
      </div>
      {result && <Result result={result} />}
      <div className="tool-notes">
        <p>Processed on your device. Files aren’t uploaded.</p>
        <PreferenceNote state={storage} />
      </div>
    </main>
  );
}
