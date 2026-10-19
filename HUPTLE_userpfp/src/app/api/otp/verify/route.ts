import { NextRequest, NextResponse } from "next/server";
import { verifyCandidateOtp } from "@/lib/otp-service";
import { generateCandidateToken } from "@/lib/candidate-auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body.email as string;
    const otp = body.otp as string;

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, message: "Email and verification code are required." },
        { status: 400 }
      );
    }

    const verification = await verifyCandidateOtp(email, otp);
    if (!verification.success) {
      return NextResponse.json(
        { success: false, message: verification.message },
        { status: 401 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const token = generateCandidateToken(normalizedEmail);

    const isSecure = process.env.NODE_ENV === "production" || req.headers.get("x-forwarded-proto") === "https";
    const maxAge = 30 * 24 * 60 * 60; // 30 days in seconds

    const response = NextResponse.json(
      {
        success: true,
        email: normalizedEmail,
        token,
        message: "Authentication successful.",
      },
      { status: 200 }
    );

    // 1. HttpOnly secure session cookie
    response.cookies.set("huptle_candidate_session", token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge,
    });

    // 2. Client-accessible session email cookie
    response.cookies.set("huptle_apply_session_email", normalizedEmail, {
      httpOnly: false,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge,
    });

    return response;
  } catch (err: unknown) {
    console.error("[api/otp/verify] Error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to verify code." },
      { status: 500 }
    );
  }
}
