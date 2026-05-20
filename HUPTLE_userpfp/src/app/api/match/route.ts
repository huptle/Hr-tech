import { NextResponse } from "next/server";
import { parseAndUploadResume } from "@/server/services/resume.service";
import { fetchJobRecommendations } from "@/server/services/hr-portal.service";
import { createProfile } from "@/server/services/profile.service";

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

    return NextResponse.json({
      success: true,
      data: {
        parsed_data: parsedData,
        resumeUrl,
        recommendations,
        profileId: row?.id,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Match failed";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
