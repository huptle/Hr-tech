import { NextResponse } from "next/server";
import { processAndStoreResume } from "@/server/services/resume.service";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const email = formData.get("email") as string;
    const file = formData.get("file") as File;
    const jobId = formData.get("jobId") as string;

    if (!email || !file || !jobId) {
      return NextResponse.json(
        { success: false, message: "Email, job id, and file are required" },
        { status: 400 },
      );
    }

    const profileData = await processAndStoreResume(email, file, jobId);

    return NextResponse.json({ success: true, data: profileData }, { status: 200 });
  } catch (error: unknown) {
    console.error("Parse resume error:", error);
    const message = error instanceof Error ? error.message : "Failed to parse resume";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}