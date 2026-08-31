export type ImageAllowedMime = "image/jpeg" | "image/png" | "image/webp";

export function detectImageMime(
  buffer: Buffer,
  fileName: string
): ImageAllowedMime | null {
  if (buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50) {
    return "image/png";
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    return "image/jpeg";
  }
  if (
    buffer.length >= 12 &&
    buffer.slice(0, 4).toString("utf8") === "RIFF" &&
    buffer.slice(8, 12).toString("utf8") === "WEBP"
  ) {
    return "image/webp";
  }

  const ext = fileName.toLowerCase().slice(fileName.lastIndexOf("."));
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return null;
}

export function extensionForImageMime(mime: ImageAllowedMime): string {
  switch (mime) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
  }
}
