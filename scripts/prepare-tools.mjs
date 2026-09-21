import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const destination = resolve("public/tool-runtime");
await mkdir(destination, { recursive: true });
for (const [directory, files] of [
  ["@ffmpeg/core/dist/esm", ["ffmpeg-core.js", "ffmpeg-core.wasm"]],
  ["@ffmpeg/ffmpeg/dist/esm", ["worker.js", "const.js", "errors.js"]],
]) {
  for (const file of files) {
    await copyFile(
      resolve("node_modules", directory, file),
      resolve(destination, file),
    );
  }
}
await writeFile(
  resolve(destination, "NOTICE.txt"),
  `FFmpeg.wasm browser runtime\n\n@ffmpeg/ffmpeg 0.12.15: MIT, copyright Jerome Wu and contributors.\n@ffmpeg/core 0.12.10: GPL-2.0-or-later, includes FFmpeg and third-party codecs.\nSource and build instructions for this runtime:\nhttps://github.com/ffmpegwasm/ffmpeg.wasm/tree/main/packages/core\nhttps://github.com/ffmpegwasm/ffmpeg.wasm/tree/main/build\nhttps://github.com/ffmpegwasm/ffmpeg.wasm/blob/main/LICENSE\nhttps://ffmpeg.org/legal.html\n\nThese are executable code assets; no user files or credentials are included.\n`,
);
