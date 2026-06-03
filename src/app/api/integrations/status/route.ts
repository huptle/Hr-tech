import { isGeminiConfigured } from "@/lib/gemini";
import { isGoogleCalendarConfigured } from "@/lib/google-calendar";
import { isVapiConfigured } from "@/lib/vapi";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    googleCalendar: isGoogleCalendarConfigured() ? "configured" : "not_configured",
    voiceAgent: isVapiConfigured() ? "configured" : "not_configured",
    email: "not_configured",
    gemini: isGeminiConfigured() ? "configured" : "not_configured",
  });
}
