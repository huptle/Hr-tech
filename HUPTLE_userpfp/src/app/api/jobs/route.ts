import { NextResponse } from "next/server";
import { fetchPublicJobsFromHr } from "@/server/services/hr-portal.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const jobs = await fetchPublicJobsFromHr();
    return NextResponse.json({ success: true, jobs });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load jobs";
    return NextResponse.json({ success: false, message, jobs: [] }, { status: 500 });
  }
}
