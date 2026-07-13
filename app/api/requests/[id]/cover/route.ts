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
  "GET /api/requests/[id]/cover",
  async (req, { params }) => {
    const { id } = await params;
    return handleListingCoverGet(req, "request", id);
  }
);

export const POST = withApiHandler(
  "POST /api/requests/[id]/cover",
  async (req, { params }) => {
    const auth = await requireAuthOrThrow(req);
    const { id } = await params;
    return handleListingCoverPost(req, "request", id, auth);
  }
);

export const DELETE = withApiHandler(
  "DELETE /api/requests/[id]/cover",
  async (req, { params }) => {
    const auth = await requireAuthOrThrow(req);
    const { id } = await params;
    return handleListingCoverDelete("request", id, auth);
  }
);
