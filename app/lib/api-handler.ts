import { NextRequest, NextResponse } from "next/server";
import { AppError, isAppError } from "@/lib/errors";
import { logRouteError } from "@/lib/logger";

type RouteContext = { params: Promise<Record<string, string>> };

type ApiHandler = (
  req: NextRequest,
  ctx: RouteContext
) => Promise<Response | NextResponse> | Response | NextResponse;

/** Errors that expose a stable HTTP status (AppError, PaymentError, …). */
function getHttpError(
  error: unknown
): { message: string; status: number } | null {
  if (isAppError(error)) {
    return { message: error.message, status: error.status };
  }
  if (
    error instanceof Error &&
    "status" in error &&
    typeof (error as { status: unknown }).status === "number"
  ) {
    return {
      message: error.message,
      status: (error as { status: number }).status,
    };
  }
  return null;
}

export function withApiHandler(
  routeLabel: string,
  handler: ApiHandler
): ApiHandler {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (error) {
      const httpErr = getHttpError(error);
      if (httpErr) {
        return NextResponse.json(
          { error: httpErr.message },
          { status: httpErr.status }
        );
      }
      logRouteError(routeLabel, error);
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
  };
}

export function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function throwUnauthorized(message = "Non autorisé"): never {
  throw new AppError(message, 401);
}

export function throwForbidden(message = "Accès refusé"): never {
  throw new AppError(message, 403);
}

export function throwNotFound(message = "Ressource introuvable"): never {
  throw new AppError(message, 404);
}
