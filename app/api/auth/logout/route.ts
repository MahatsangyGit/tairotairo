import { NextResponse } from "next/server";
import { getAuthCookieName, getAuthCookieOptions } from "@/lib/auth-cookie";

export async function POST() {
  const response = NextResponse.json({ message: "Déconnexion réussie" });

  response.cookies.set(getAuthCookieName(), "", getAuthCookieOptions(0));

  return response;
}
