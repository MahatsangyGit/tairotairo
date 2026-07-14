import { NextRequest, NextResponse } from "next/server";
import { AppError, isAppError, isPrismaKnownError } from "@/lib/errors";
import { logRouteError } from "@/lib/logger";
import { getRequestId } from "@/lib/request-context";

type RouteContext = { params: Promise<Record<string, string>> };

type ApiHandler = (
  req: NextRequest,
  ctx: RouteContext
) => Promise<Response | NextResponse> | Response | NextResponse;

/** Errors that expose a stable HTTP status (AppError, PaymentError, …). */
function getHttpError(
  error: unknown
): { message: string; status: number; code?: string } | null {
  if (isAppError(error)) {
    return { message: error.message, status: error.status, code: error.code };
  }
  if (isPrismaKnownError(error)) {
    if (error.code === "P2002") {
      return {
        message: "Conflit : cette ressource existe déjà",
        status: 409,
        code: "CONFLICT",
      };
    }
    if (error.code === "P2025") {
      return {
        message: "Ressource introuvable",
        status: 404,
        code: "NOT_FOUND",
      };
    }
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
      const requestId = getRequestId();
      if (httpErr) {
        return NextResponse.json(
          {
            error: httpErr.message,
            ...(httpErr.code ? { code: httpErr.code } : {}),
            ...(requestId ? { requestId } : {}),
          },
          { status: httpErr.status }
        );
      }
      logRouteError(routeLabel, error);
      return NextResponse.json(
        {
          error: "Erreur serveur",
          code: "INTERNAL_ERROR",
          ...(requestId ? { requestId } : {}),
        },
        { status: 500 }
      );
    }
  };
}

export function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function throwUnauthorized(message = "Non autorisé"): never {
  throw new AppError(message, 401, true, "UNAUTHORIZED");
}

export function throwForbidden(message = "Accès refusé"): never {
  throw new AppError(message, 403, true, "FORBIDDEN");
}

export function throwNotFound(message = "Ressource introuvable"): never {
  throw new AppError(message, 404, true, "NOT_FOUND");
}

export function throwConflict(message = "Conflit"): never {
  throw new AppError(message, 409, true, "CONFLICT");
}
