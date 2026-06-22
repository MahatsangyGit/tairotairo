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

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, phone, role } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nom, email et mot de passe obligatoires" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé" },
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