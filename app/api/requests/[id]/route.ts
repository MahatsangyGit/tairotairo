import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { withApiHandler, throwNotFound } from "@/lib/api-handler";
import { canViewRequestClientPhone } from "@/lib/contact-privacy";
import { withCoverImageUrl } from "@/lib/listing-cover";
import {
  handleRequestDelete,
  handleRequestPatch,
} from "@/lib/listing-crud-handlers";

export const GET = withApiHandler(
  "GET /api/requests/[id]",
  async (req, { params }) => {
    const { id } = await params;
    const viewer = await getAuthUser(req);

    const request = await prisma.serviceRequest.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            avatar: true,
            phone: true,
          },
        },
      },
    });

    if (!request) {
      throwNotFound("Demande introuvable");
    }

    const showClientPhone = await canViewRequestClientPhone(
      id,
      request.clientId,
      viewer
    );

    const client = {
      id: request.client.id,
      name: request.client.name,
      avatar: request.client.avatar,
      phone: showClientPhone ? request.client.phone : null,
    };

    const { client: _client, ...requestFields } = request;

    return NextResponse.json({
      request: withCoverImageUrl("request", { ...requestFields, client }),
    });
  }
);

export const PATCH = withApiHandler(
  "PATCH /api/requests/[id]",
  async (req, { params }) => {
    const { id } = await params;
    return handleRequestPatch(req, id);
  }
);

export const DELETE = withApiHandler(
  "DELETE /api/requests/[id]",
  async (req, { params }) => {
    const { id } = await params;
    return handleRequestDelete(req, id);
  }
);
