import { isGeminiConfigured } from "@/lib/gemini";
import { NextResponse } from "next/server";

/** Placeholder for Google Calendar, voice provider webhooks, email provider health */
export async function GET() {
  return NextResponse.json({
    googleCalendar: "not_configured",
    voiceAgent: "not_configured",
    email: "not_configured",
    gemini: isGeminiConfigured() ? "configured" : "not_configured",
  });
}
