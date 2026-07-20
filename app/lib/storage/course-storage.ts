import { createReadStream, type ReadStream } from "fs";
import { access, mkdir, stat } from "fs/promises";
import path from "path";
import { assertSafeStorageId } from "@/lib/storage-path";
import { getStorageBackend, getStorageRoot } from "@/lib/storage/backend";

export const COURSE_VIDEO_MAX_BYTES = 300 * 1024 * 1024;
export const COURSE_VIDEO_ALLOWED_MIME = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
] as const;

export type CourseVideoMime = (typeof COURSE_VIDEO_ALLOWED_MIME)[number];

function lessonVideoKey(courseId: string, lessonId: string, ext: string): string {
  assertSafeStorageId(courseId);
  assertSafeStorageId(lessonId);
  return `courses/${courseId}/lessons/${lessonId}/video${ext}`;
}

function extForMime(mime: CourseVideoMime): string {
  switch (mime) {
    case "video/webm":
      return ".webm";
    case "video/quicktime":
      return ".mov";
    default:
      return ".mp4";
  }
}

export function validateCourseVideoMeta(
  mime: string,
  sizeBytes: number
): { ok: true; mime: CourseVideoMime } | { ok: false; error: string } {
  if (sizeBytes <= 0) {
    return { ok: false, error: "Fichier vidéo vide" };
  }
  if (sizeBytes > COURSE_VIDEO_MAX_BYTES) {
    return {
      ok: false,
      error: `Vidéo trop volumineuse (max ${COURSE_VIDEO_MAX_BYTES / (1024 * 1024)} Mo)`,
    };
  }
  if (!COURSE_VIDEO_ALLOWED_MIME.includes(mime as CourseVideoMime)) {
    return { ok: false, error: "Format vidéo non autorisé (MP4, WebM, MOV)" };
  }
  return { ok: true, mime: mime as CourseVideoMime };
}

export async function saveCourseLessonVideo(
  courseId: string,
  lessonId: string,
  buffer: Buffer,
  mime: CourseVideoMime
): Promise<{ key: string; mime: CourseVideoMime; sizeBytes: number }> {
  const ext = extForMime(mime);
  const key = lessonVideoKey(courseId, lessonId, ext);
  const backend = getStorageBackend();

  if ((process.env.STORAGE_BACKEND ?? "local").toLowerCase() === "local") {
    const fullPath = path.join(getStorageRoot(), key);
    await mkdir(path.dirname(fullPath), { recursive: true });
  }

  await backend.put(key, buffer, mime);
  return { key, mime, sizeBytes: buffer.length };
}

export async function deleteCourseLessonVideo(
  key: string | null | undefined
): Promise<void> {
  if (!key || !key.startsWith("courses/")) return;
  await getStorageBackend().delete(key);
}

export async function getCourseVideoLocalPath(
  key: string
): Promise<string | null> {
  if (!key.startsWith("courses/")) return null;
  if ((process.env.STORAGE_BACKEND ?? "local").toLowerCase() !== "local") {
    return null;
  }
  const fullPath = path.join(getStorageRoot(), key);
  try {
    await access(fullPath);
    return fullPath;
  } catch {
    return null;
  }
}

export async function openCourseVideoStream(
  key: string,
  range?: { start: number; end: number }
): Promise<
  | { kind: "local"; stream: ReadStream; size: number }
  | { kind: "buffer"; buffer: Buffer; size: number }
  | null
> {
  const localPath = await getCourseVideoLocalPath(key);
  if (localPath) {
    const info = await stat(localPath);
    const stream = range
      ? createReadStream(localPath, { start: range.start, end: range.end })
      : createReadStream(localPath);
    return { kind: "local", stream, size: info.size };
  }

  const buffer = await getStorageBackend().get(key);
  if (!buffer) return null;
  if (range) {
    return {
      kind: "buffer",
      buffer: buffer.subarray(range.start, range.end + 1),
      size: buffer.length,
    };
  }
  return { kind: "buffer", buffer, size: buffer.length };
}
