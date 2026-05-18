import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getGoogleAuthUrl, isGoogleCalendarConfigured } from "@/lib/google-calendar";
import { SignJWT } from "jose";

export const runtime = "nodejs";

async function oauthStateSecret(): Promise<Uint8Array> {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET required for Google OAuth state.");
  }
  return new TextEncoder().encode(secret);
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/signin", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
  }

  if (!isGoogleCalendarConfigured()) {
    return NextResponse.json(
      { error: "Google Calendar OAuth is not configured on the server." },
      { status: 503 },
    );
  }

  const state = await new SignJWT({ uid: user.id })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(await oauthStateSecret());

  const url = getGoogleAuthUrl(state);
  return NextResponse.redirect(url);
}
