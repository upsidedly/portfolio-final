import { test } from "node:test";
import assert from "node:assert/strict";
import { buildMediaCommand } from "./media";
import { conversionTargets, extension, outputName } from "./formats";

void test("pitch-speed resampling follows the actual source sample rate", () => {
  for (const sourceSampleRate of [44100, 48000, 96000]) {
    for (const rate of [0.5, 0.8, 1.25, 2]) {
      const args = buildMediaCommand("input", "output.wav", "wav", {
        sourceSampleRate,
        rate,
      });
      const filter = args[args.indexOf("-filter:a") + 1];
      assert.match(
        filter!,
        new RegExp(
          `asetrate=${Math.round(sourceSampleRate * rate)},aresample=sample_rate=${sourceSampleRate}`,
        ),
      );
      assert.match(filter!, /filter_size=128/);
      assert(
        !args.some((arg) => arg.includes("atempo")),
        "No independent time-stretch artifacts",
      );
    }
  }
});

void test("invalid rates and missing streams fail before conversion", () => {
  for (const rate of [NaN, Infinity, 0, 0.49, 2.01])
    assert.throws(() => buildMediaCommand("i", "o", "wav", { rate }), /Speed/);
  assert.throws(
    () => buildMediaCommand("i", "o", "wav", { rate: 1.25 }),
    /sample rate/,
  );
  assert.throws(
    () => buildMediaCommand("i", "o", "wav", { hasAudio: false }),
    /no audio/,
  );
  assert.throws(
    () => buildMediaCommand("i", "o", "mp4", { hasVideo: false }),
    /no video/,
  );
  for (const videoSize of [
    { width: 15, height: 720 },
    { width: 1281, height: 720 },
    { width: 3840, height: 2162 },
    { width: 3840, height: 3840 },
  ]) {
    assert.throws(
      () =>
        buildMediaCommand("i", "o.mp4", "mp4", {
          hasAudio: true,
          hasVideo: false,
          videoSize,
        }),
      /Video dimensions/,
    );
  }
});

void test("builds an MP3-to-MP4 black video with the requested dimensions", () => {
  const args = buildMediaCommand("song.mp3", "song.mp4", "mp4", {
    hasAudio: true,
    hasVideo: false,
    videoSize: { width: 1920, height: 1080 },
  });
  assert.deepEqual(args.slice(0, 8), [
    "-f",
    "lavfi",
    "-i",
    "color=c=black:s=1920x1080:r=24",
    "-i",
    "song.mp3",
    "-map",
    "0:v:0",
  ]);
  assert(args.includes("1:a:0"));
  assert(args.includes("-shortest"));
  assert(args.includes("-tune") && args.includes("stillimage,zerolatency"));
  assert(args.includes("-b:a") && args.includes("320k"));
  assert(args.some((arg) => arg.includes("yuv420p")));
  const spedUp = buildMediaCommand("song.mp3", "song.mp4", "mp4", {
    hasAudio: true,
    hasVideo: false,
    sourceSampleRate: 44100,
    rate: 1.25,
  });
  assert(
    spedUp.some((arg) =>
      arg.includes("asetrate=55125,aresample=sample_rate=44100"),
    ),
  );
});

void test("exports choose real encoders and lossless depth", () => {
  assert(buildMediaCommand("i", "o.mp3", "mp3").includes("320k"));
  assert(buildMediaCommand("i", "o.wav", "wav").includes("pcm_s24le"));
  assert(buildMediaCommand("i", "o.flac", "flac").includes("24"));
  assert(buildMediaCommand("i", "o.webm", "webm").includes("libvpx"));
  assert(
    buildMediaCommand("i", "o.mp4", "mp4").some((arg) =>
      arg.includes("yuv420p"),
    ),
  );
});

void test("supported targets never disguise unsupported documents or binaries", () => {
  assert.deepEqual(conversionTargets("file.docx"), []);
  assert.deepEqual(conversionTargets("file.exe"), []);
  assert.deepEqual(conversionTargets("script.JS"), ["txt"]);
  assert(conversionTargets("video.mov").includes("mp3"));
  assert(conversionTargets("song.mp3").includes("mp4"));
  assert.deepEqual(conversionTargets("table.csv"), ["json", "txt"]);
  assert.equal(extension("audio.final.MP3"), "mp3");
  assert.equal(outputName("audio.final.MP3", "wav"), "audio.final.wav");
});
