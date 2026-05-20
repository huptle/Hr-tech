import { NextResponse } from "next/server";
import { generateAndSendOtp, verifyOtp } from "../services/otp.service";
import { processAndStoreResume } from "../services/resume.service";

export const handleSendOtp = async (req: Request) => {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    await generateAndSendOtp(email);
    
    return NextResponse.json({ success: true, message: "OTP sent successfully" }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to send OTP" },
      { status: 500 }
    );
  }
};

export const handleVerifyOtp = async (req: Request) => {
  try {
    const contentType = req.headers.get("content-type") || "";
    let email: string;
    let otp: string;
    let file: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      email = formData.get("email") as string;
      otp = formData.get("otp") as string;
      file = formData.get("resume") as File | null;
    } else {
      const body = await req.json();
      email = body.email;
      otp = body.otp;
    }

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, message: "Email and OTP are required" },
        { status: 400 }
      );
    }

    const isValid = await verifyOtp(email, otp);
    
    if (isValid) {
      let profile = null;
      if (file) {
        // Trigger profile creation service once OTP is verified
        profile = await processAndStoreResume(email, file);
      }

      return NextResponse.json({ success: true, message: "OTP verified", profile }, { status: 200 });
    } else {
      return NextResponse.json({ success: false, message: "Invalid or expired OTP" }, { status: 400 });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Failed to verify OTP" },
      { status: 500 }
    );
  }
};
