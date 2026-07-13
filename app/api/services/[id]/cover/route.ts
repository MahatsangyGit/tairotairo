import { requireAuthOrThrow } from "@/lib/auth";
import { withApiHandler } from "@/lib/api-handler";
import {
  handleListingCoverDelete,
  handleListingCoverGet,
  handleListingCoverPost,
} from "@/lib/listing-cover-handlers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApiHandler(
  "GET /api/services/[id]/cover",
  async (req, { params }) => {
    const { id } = await params;
    return handleListingCoverGet(req, "service", id);
  }
);

export const POST = withApiHandler(
  "POST /api/services/[id]/cover",
  async (req, { params }) => {
    const auth = await requireAuthOrThrow(req);
    const { id } = await params;
    return handleListingCoverPost(req, "service", id, auth);
  }
);

export const DELETE = withApiHandler(
  "DELETE /api/services/[id]/cover",
  async (req, { params }) => {
    const auth = await requireAuthOrThrow(req);
    const { id } = await params;
    return handleListingCoverDelete("service", id, auth);
  }
);
