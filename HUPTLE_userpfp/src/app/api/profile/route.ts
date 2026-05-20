import { NextResponse } from "next/server";
import { createProfile, getProfileByEmail } from "@/server/services/profile.service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    if (!body.email) {
      return NextResponse.json({ success: false, message: "Email is required" }, { status: 400 });
    }

    const data = await createProfile(body);
    
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error: any) {
    console.error("Save profile error:", error);
    return NextResponse.json({ success: false, message: error.message || "Failed to save profile" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ success: false, message: "Email query param is required" }, { status: 400 });
    }

    const data = await getProfileByEmail(email);
    
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    console.error("Get profile error:", error);
    return NextResponse.json({ success: false, message: error.message || "Failed to fetch profile" }, { status: 500 });
  }
}
