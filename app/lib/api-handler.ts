import { NextRequest, NextResponse } from "next/server";
import { AppError, isAppError } from "@/lib/errors";
import { logRouteError } from "@/lib/logger";

type RouteContext = { params: Promise<Record<string, string>> };

type ApiHandler = (
  req: NextRequest,
  ctx: RouteContext
) => Promise<NextResponse> | NextResponse;

export function withApiHandler(
  routeLabel: string,
  handler: ApiHandler
): ApiHandler {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (error) {
      if (isAppError(error)) {
        return NextResponse.json({ error: error.message }, { status: error.status });
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
