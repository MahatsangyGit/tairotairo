import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { notifyNewRequestResponse } from "@/lib/notify-requests";
import { assertProviderKycApproved } from "@/lib/provider-kyc";
import { assertEmailVerified } from "@/lib/email-verification";
import {
  parseBody,
  parseJsonBody,
  requestResponseCreateSchema,
} from "@/lib/api-schemas";

const providerSelect = {
  id: true,
  name: true,
  avatar: true,
  phone: true,
  bio: true,
};

const responseInclude = {
  provider: { select: providerSelect },
  booking: { select: { id: true, status: true } },
};

// GET - Lister les propositions d'une demande
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;

    const request = await prisma.serviceRequest.findUnique({
      where: { id },
      select: { id: true, clientId: true, open: true },
    });

    if (!request) {
      return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
    }

    if (!user) {
      return NextResponse.json({ responses: [], pendingCount: 0 });
    }

    const isOwner = request.clientId === user.userId;
    const isProvider = user.role === "PROVIDER" || user.role === "ADMIN";

    if (isOwner || user.role === "ADMIN") {
      const responses = await prisma.requestResponse.findMany({
        where: { requestId: id },
        orderBy: { createdAt: "desc" },
        include: responseInclude,
      });

      return NextResponse.json({
        responses,
        role: user.role,
        isOwner: true,
      });
    }

    if (isProvider) {
      const ownResponse = await prisma.requestResponse.findUnique({
        where: {
          requestId_providerId: { requestId: id, providerId: user.userId },
        },
        include: responseInclude,
      });

      return NextResponse.json({
        responses: ownResponse ? [ownResponse] : [],
        role: user.role,
        isOwner: false,
        canPropose: request.open && !ownResponse,
      });
    }

    return NextResponse.json({ responses: [], role: user.role, isOwner: false });
  } catch (error) {
    console.error("[GET /api/requests/[id]/responses]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Soumettre une proposition (prestataire)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (user.role !== "PROVIDER" && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Seuls les prestataires peuvent proposer" },
        { status: 403 }
      );
    }

    if (user.role === "PROVIDER") {
      const emailCheck = await assertEmailVerified(user.userId, user.role);
      if (!emailCheck.ok) {
        return NextResponse.json(
          { error: emailCheck.error },
          { status: emailCheck.status }
        );
      }

      const kycCheck = await assertProviderKycApproved(user.userId, user.role);
      if (!kycCheck.ok) {
        return NextResponse.json(
          { error: kycCheck.error },
          { status: kycCheck.status }
        );
      }
    }

    const { id } = await params;

    const json = await parseJsonBody(req);
    if (!json.ok) return json.response;

    const parsed = parseBody(requestResponseCreateSchema, json.body);
    if (!parsed.ok) return parsed.response;

    const { message, proposedPrice } = parsed.data;
    const trimmedMessage = message;

    let parsedPrice: number | null = null;
    if (
      proposedPrice !== undefined &&
      proposedPrice !== null &&
      proposedPrice !== ""
    ) {
      parsedPrice = proposedPrice as number;
    }

    const request = await prisma.serviceRequest.findUnique({
      where: { id },
    });

    if (!request) {
      return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
    }

    if (!request.open) {
      return NextResponse.json(
        { error: "Cette demande n'accepte plus de propositions" },
        { status: 400 }
      );
    }

    if (request.clientId === user.userId) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas répondre à votre propre demande" },
        { status: 400 }
      );
    }

    const existing = await prisma.requestResponse.findUnique({
      where: {
        requestId_providerId: { requestId: id, providerId: user.userId },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Vous avez déjà envoyé une proposition pour cette demande" },
        { status: 400 }
      );
    }

    const response = await prisma.requestResponse.create({
      data: {
        requestId: id,
        providerId: user.userId,
        message: trimmedMessage,
        proposedPrice: parsedPrice,
      },
      include: responseInclude,
    });

    const provider = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { name: true },
    });

    notifyNewRequestResponse(id, provider?.name ?? "Un prestataire").catch(
      console.error
    );

    return NextResponse.json(
      { message: "Proposition envoyée avec succès", response },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/requests/[id]/responses]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
