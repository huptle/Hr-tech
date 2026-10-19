import { NextResponse } from "next/server";
import { errorMessage } from "@/lib/error-message";
import { createProfile, getProfileByEmail } from "@/server/services/profile.service";
import { getAuthenticatedCandidateEmail } from "@/lib/candidate-auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const authenticatedEmail = getAuthenticatedCandidateEmail(req);
    const body = await req.json();
    
    if (!body.email) {
      return NextResponse.json({ success: false, message: "Email is required" }, { status: 400 });
    }

    const requestedEmail = body.email.trim().toLowerCase();

    // Enforce that a user cannot modify someone else's profile
    if (!authenticatedEmail || authenticatedEmail !== requestedEmail) {
      return NextResponse.json(
        { success: false, message: "Authentication required. You may only update your own profile." },
        { status: 401 }
      );
    }

    const data = await createProfile(body);
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error: unknown) {
    console.error("Save profile error:", error);
    return NextResponse.json(
      { success: false, message: errorMessage(error, "Failed to save profile") },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const authenticatedEmail = getAuthenticatedCandidateEmail(req);
    const { searchParams } = new URL(req.url);
    const queryEmail = searchParams.get("email")?.trim().toLowerCase();

    // If caller has no authenticated session
    if (!authenticatedEmail) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required. Please verify your email to access your profile.",
        },
        { status: 401 }
      );
    }

    // If caller specified an email that doesn't match their authenticated identity
    if (queryEmail && queryEmail !== authenticatedEmail) {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden. You are not authorized to view another candidate's profile.",
        },
        { status: 403 }
      );
    }

    const targetEmail = queryEmail || authenticatedEmail;
    try {
      const data = await getProfileByEmail(targetEmail);

      if (!data) {
        return NextResponse.json(
          { success: false, message: "No profile found for this candidate." },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (err: unknown) {
      const msg = errorMessage(err, "Failed to fetch profile");
      if (msg.toLowerCase().includes("not found")) {
        return NextResponse.json({ success: false, message: msg }, { status: 404 });
      }
      throw err;
    }
  } catch (error: unknown) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { success: false, message: errorMessage(error, "Failed to fetch profile") },
      { status: 500 }
    );
  }
}
