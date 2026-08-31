import type { ImageOptimizePreset, OptimizedImage } from "@/lib/image-optimize";
import {
  optimizeUploadImageViaQueue,
  resolveImageOptimizeMode,
} from "@/lib/image-optimize-queue";

/**
 * Point d'entrée unique pour l'optimisation d'images uploadées.
 * - `queue` : Sharp tourne dans le process worker (BullMQ + Redis)
 * - `inline` : Sharp dans le process API (dev sans Redis / fallback explicite)
 */
export async function optimizeUploadImageDispatched(
  input: Buffer,
  preset: ImageOptimizePreset
): Promise<OptimizedImage> {
  const mode = resolveImageOptimizeMode();

  if (mode === "queue") {
    return optimizeUploadImageViaQueue(input, preset);
  }

  const { optimizeUploadImage } = await import("@/lib/image-optimize");
  return optimizeUploadImage(input, preset);
}
