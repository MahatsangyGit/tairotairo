import sharp from "sharp";
import type { ImageAllowedMime } from "@/lib/image-upload-validation";
import { toIsolatedBuffer } from "@/lib/isolated-buffer";

export type OptimizedImage = {
  buffer: Buffer;
  mime: ImageAllowedMime;
  extension: ".webp";
  width: number;
  height: number;
  sizeBytes: number;
};

export type ImageOptimizePreset = "avatar" | "portfolio" | "cover";

const PRESETS: Record<
  ImageOptimizePreset,
  { maxWidth: number; maxHeight: number; quality: number }
> = {
  // Carré compact pour avatars (affichage ~32–128px, marge retina).
  avatar: { maxWidth: 512, maxHeight: 512, quality: 80 },
  // Réalisations portfolio : assez nettes sur mobile/desktop.
  portfolio: { maxWidth: 1600, maxHeight: 1600, quality: 82 },
  // Couvertures demandes / services (hero cards).
  cover: { maxWidth: 1920, maxHeight: 1080, quality: 80 },
};

/**
 * Redimensionne, corrige l'orientation EXIF et compresse en WebP.
 * Toutes les images utilisateur (hors KYC) sont normalisées en WebP.
 */
export async function optimizeUploadImage(
  input: Buffer,
  preset: ImageOptimizePreset
): Promise<OptimizedImage> {
  const { maxWidth, maxHeight, quality } = PRESETS[preset];

  const pipeline = sharp(input, { failOn: "none" })
    .rotate() // applique l'orientation EXIF puis la retire
    .resize({
      width: maxWidth,
      height: maxHeight,
      fit: preset === "avatar" ? "cover" : "inside",
      withoutEnlargement: true,
      position: "centre",
    })
    .webp({
      quality,
      effort: 4,
      smartSubsample: true,
    });

  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
  const buffer = toIsolatedBuffer(data);

  return {
    buffer,
    mime: "image/webp",
    extension: ".webp",
    width: info.width,
    height: info.height,
    sizeBytes: buffer.length,
  };
}
