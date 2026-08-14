import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getBcryptRounds } from "@/lib/env";
import prisma from "../../../lib/prisma";
import { sendWelcomeEmail } from "@/lib/email";
import { parsePublicRegistrationRole } from "@/lib/roles";
import { parseClientKind } from "@/lib/client-kind";
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
import { verifyTurnstileToken } from "@/lib/turnstile";
import { withApiHandler } from "@/lib/api-handler";

const REGISTRATION_FAILED_MESSAGE =
  "Impossible de créer le compte avec ces informations.";

export const POST = withApiHandler("POST /api/auth/register", async (req) => {
  const rateLimited = await enforceRateLimit(req, "register", AUTH_RATE_LIMITS.register);
  if (rateLimited) return rateLimited;

  const json = await parseJsonBody(req);
  if (!json.ok) return json.response;

  const parsed = parseBody(registerSchema, json.body);
  if (!parsed.ok) return parsed.response;

  const {
    name,
    email,
    password,
    phone,
    role,
    clientKind,
    companyName,
    companyAddress,
    nif,
    stat,
    rcs,
    turnstileToken,
  } = parsed.data;
  const turnstile = await verifyTurnstileToken(req, turnstileToken, "register");
  if (!turnstile.ok) {
    return NextResponse.json({ error: turnstile.error }, { status: 400 });
  }

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

  const hashedPassword = await bcrypt.hash(password, getBcryptRounds());
  const safeRole = parsePublicRegistrationRole(role);
  const safeClientKind =
    safeRole === "CLIENT" ? parseClientKind(clientKind) : "INDIVIDUAL";
  const isProfessional = safeClientKind === "PROFESSIONAL";
  const displayName = isProfessional
    ? (companyName || name || "").trim()
    : (name || "").trim();

  const user = await prisma.user.create({
    data: {
      name: displayName,
      email,
      password: hashedPassword,
      phone,
      role: safeRole,
      clientKind: safeClientKind,
      companyName: isProfessional ? displayName : null,
      companyAddress: isProfessional ? companyAddress ?? null : null,
      nif: isProfessional ? nif ?? null : null,
      stat: isProfessional ? stat ?? null : null,
      rcs: isProfessional ? rcs ?? null : null,
    },
  });

  sendWelcomeEmail(user.email, user.name).catch(console.error);

  void identifyServerUser(user.id, {
    email: user.email,
    name: user.name,
    role: user.role,
    clientKind: user.clientKind,
  }).catch(console.error);
  void captureServerEvent(user.id, PostHogEvents.USER_SIGNED_UP, {
    role: user.role,
    clientKind: user.clientKind,
  }).catch(console.error);

  return NextResponse.json(
    { message: "Compte créé avec succès", userId: user.id },
    { status: 201 }
  );
});
