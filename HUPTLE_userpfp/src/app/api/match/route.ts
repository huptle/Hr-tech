import { NextResponse } from "next/server";
import { parseAndUploadResume } from "@/server/services/resume.service";
import { fetchJobRecommendations } from "@/server/services/hr-portal.service";
import { createProfile } from "@/server/services/profile.service";
import { generateCandidateToken } from "@/lib/candidate-auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const email = formData.get("email") as string;
    const file = formData.get("file") as File;

    if (!email || !file) {
      return NextResponse.json(
        { success: false, message: "Email and resume file are required" },
        { status: 400 },
      );
    }

    const { parsedData, resumeUrl } = await parseAndUploadResume(email, file);
    const recommendations = await fetchJobRecommendations(parsedData);

    const profile = await createProfile({
      name: parsedData.userInfo.name,
      email: parsedData.userInfo.email,
      phone: parsedData.userInfo.phone || "",
      skills: parsedData.userInfo.skills,
      experience: "",
      education: "",
      summary: parsedData.userInfo.summary || "",
      resumeUrl,
      parsedData,
    });

    const row = profile?.[0];
    const normalizedEmail = email.trim().toLowerCase();
    const token = generateCandidateToken(normalizedEmail);
    const isSecure = process.env.NODE_ENV === "production" || req.headers.get("x-forwarded-proto") === "https";
    const maxAge = 30 * 24 * 60 * 60; // 30 days

    const response = NextResponse.json({
      success: true,
      data: {
        parsed_data: parsedData,
        resumeUrl,
        recommendations,
        profileId: row?.id,
      },
    });

    response.cookies.set("huptle_candidate_session", token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge,
    });

    response.cookies.set("huptle_apply_session_email", normalizedEmail, {
      httpOnly: false,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge,
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Match failed";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
