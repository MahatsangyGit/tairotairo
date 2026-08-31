import { withApiHandler } from "@/lib/api-handler";
import {
  handleRequestsGet,
  handleRequestsPost,
} from "@/lib/listing-crud-handlers";

export const GET = withApiHandler("GET /api/requests", handleRequestsGet);
export const POST = withApiHandler("POST /api/requests", handleRequestsPost);
