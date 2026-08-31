import { withApiHandler } from "@/lib/api-handler";
import {
  handleServicesGet,
  handleServicesPost,
} from "@/lib/listing-crud-handlers";

export const GET = withApiHandler("GET /api/services", handleServicesGet);
export const POST = withApiHandler("POST /api/services", handleServicesPost);
