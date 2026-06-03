import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import {
  exchangeGoogleCode,
  saveGoogleTokensForUser,
} from "@/lib/google-calendar";

export const runtime = "nodejs";

async function oauthStateSecret(): Promise<Uint8Array> {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET required.");
  }
  return new TextEncoder().encode(secret);
}

function appOrigin(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const err = searchParams.get("error");

  const profileUrl = new URL("/profile", appOrigin());

  if (err || !code || !state) {
    profileUrl.searchParams.set("google", "error");
    return NextResponse.redirect(profileUrl);
  }

  try {
    const { payload } = await jwtVerify(state, await oauthStateSecret());
    const uid = payload.uid;
    if (typeof uid !== "string") throw new Error("Invalid state");

    const tokens = await exchangeGoogleCode(code);
    await saveGoogleTokensForUser(uid, tokens);

    profileUrl.searchParams.set("google", "connected");
    return NextResponse.redirect(profileUrl);
  } catch {
    profileUrl.searchParams.set("google", "error");
    return NextResponse.redirect(profileUrl);
  }
}
