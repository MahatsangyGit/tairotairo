import { readAvatarFile } from "@/lib/avatar-storage";
import {
  createImageResponse,
  isVersionedImageRequest,
} from "@/lib/image-response";
import { InvalidStorageIdError } from "@/lib/storage-path";
import { withApiHandler, throwNotFound } from "@/lib/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApiHandler(
  "GET /api/users/[id]/avatar",
  async (req, { params }) => {
    const { id } = await params;

    let file;
    try {
      file = await readAvatarFile(id);
    } catch (error) {
      if (error instanceof InvalidStorageIdError) {
        throwNotFound("Photo introuvable");
      }
      throw error;
    }

    if (!file) {
      throwNotFound("Photo introuvable");
    }

    return createImageResponse(req, file.buffer, file.mime, {
      versioned: isVersionedImageRequest(req),
    });
  }
);
