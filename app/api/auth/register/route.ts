import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "../../../lib/prisma";
import { sendWelcomeEmail } from "@/lib/email";
import { parsePublicRegistrationRole } from "@/lib/roles";
import { PostHogEvents } from "@/lib/posthog";
import {
  captureServerEvent,
  identifyServerUser,
} from "@/lib/posthog-server";
import { enforceRateLimit, AUTH_RATE_LIMITS } from "@/lib/rate-limit";
import { logSecurityEventFromRequest } from "@/lib/security-audit";
import {
  parseBody,
  parseJsonBody,
  registerSchema,
} from "@/lib/api-schemas";

const REGISTRATION_FAILED_MESSAGE =
  "Impossible de créer le compte avec ces informations.";

export async function POST(req: NextRequest) {
  try {
    const rateLimited = enforceRateLimit(req, "register", AUTH_RATE_LIMITS.register);
    if (rateLimited) return rateLimited;

    const json = await parseJsonBody(req);
    if (!json.ok) return json.response;

    const parsed = parseBody(registerSchema, json.body);
    if (!parsed.ok) return parsed.response;

    const { name, email, password, phone, role } = parsed.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      logSecurityEventFromRequest("auth.register_duplicate", req, { email });
      return NextResponse.json(
        { error: REGISTRATION_FAILED_MESSAGE },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const safeRole = parsePublicRegistrationRole(role);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        role: safeRole,
      },
    });

    sendWelcomeEmail(user.email, user.name).catch(console.error);

    void identifyServerUser(user.id, {
      email: user.email,
      name: user.name,
      role: user.role,
    }).catch(console.error);
    void captureServerEvent(user.id, PostHogEvents.USER_SIGNED_UP, {
      role: user.role,
    }).catch(console.error);

    return NextResponse.json(
      { message: "Compte créé avec succès", userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
