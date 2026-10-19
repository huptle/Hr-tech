import { NextRequest, NextResponse } from "next/server";
import { sendCandidateOtp } from "@/lib/otp-service";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body.email as string;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { success: false, message: "A valid email address is required." },
        { status: 400 }
      );
    }

    const result = await sendCandidateOtp(email);
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: result.message,
        ...(result.testOtp ? { testOtp: result.testOtp } : {}),
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("[api/otp/send] Error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to send verification code." },
      { status: 500 }
    );
  }
}
