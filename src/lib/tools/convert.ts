import { conversionTargets, extension } from "./formats";

export const MAX_FILE_BYTES = 256 * 1024 * 1024;

export async function convertFile(
  file: File,
  format: string,
  options: {
    signal: AbortSignal;
    onStatus: (status: string) => void;
    videoSize?: { width: number; height: number };
  },
): Promise<Blob> {
  options.signal.throwIfAborted();
  if (file.size > MAX_FILE_BYTES)
    throw new Error("Choose a file smaller than 256 MB.");
  if (!file.size) throw new Error("This file is empty. Choose another file.");
  if (!conversionTargets(file.name).includes(format))
    throw new Error(
      "That conversion isn’t supported. Choose one of the available formats.",
    );
  const source = extension(file.name);
  if (
    (source === "csv" && format === "json") ||
    (source === "json" && format === "csv")
  ) {
    if (file.size > 10 * 1024 * 1024)
      throw new Error("Choose a data file smaller than 10 MB.");
    options.onStatus("Converting data…");
    const { csvToJson, jsonToCsv } = await import("./data");
    const text = await file.text();
    options.signal.throwIfAborted();
    const result = format === "json" ? csvToJson(text) : jsonToCsv(text);
    return new Blob([result], {
      type: format === "json" ? "application/json" : "text/csv;charset=utf-8",
    });
  }
  if (["png", "jpg", "jpeg", "webp", "bmp", "avif", "gif"].includes(source)) {
    options.onStatus("Converting image…");
    const bitmap = await createImageBitmap(file);
    try {
      if (bitmap.width * bitmap.height > 40_000_000)
        throw new Error("Choose an image smaller than 40 megapixels.");
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext("2d");
      if (!context)
        throw new Error("Image conversion is unavailable in this browser.");
      if (format === "jpg") {
        context.fillStyle = "#fff";
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
      context.drawImage(bitmap, 0, 0);
      const mime = format === "jpg" ? "image/jpeg" : `image/${format}`;
      try {
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, mime, 0.96),
        );
        options.signal.throwIfAborted();
        if (blob?.type !== mime)
          throw new Error("Your browser cannot export this image format.");
        return blob;
      } finally {
        canvas.width = canvas.height = 0;
      }
    } finally {
      bitmap.close();
    }
  }
  if (format === "txt" || (source === "txt" && format === "md")) {
    options.onStatus("Preparing text…");
    // Preserve all original bytes, including the original encoding and line endings.
    return file.slice(0, file.size, "text/plain;charset=utf-8");
  }
  const { convertMedia } = await import("./media");
  return convertMedia(file, format, options);
}
