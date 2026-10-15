import { NextRequest, NextResponse } from "next/server";
import { fetchPublicJobsFromHr } from "@/server/services/hr-portal.service";

export const runtime = "nodejs";

function verifyPartnerAuth(req: NextRequest): boolean {
  const expectedKey =
    process.env.MENTORLEE_API_KEY?.trim() ||
    process.env.PARTNER_API_KEY?.trim() ||
    process.env.CANDIDATE_SYNC_SECRET?.trim();

  // If no partner key is configured, reject for security
  if (!expectedKey) {
    console.warn("[partner-jobs] MENTORLEE_API_KEY is not configured.");
    return false;
  }

  const headerKey =
    req.headers.get("x-partner-key")?.trim() ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "")?.trim();

  return headerKey === expectedKey;
}

export async function GET(req: NextRequest) {
  if (!verifyPartnerAuth(req)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized. Provide a valid X-Partner-Key or Authorization Bearer header." },
      { status: 401 }
    );
  }

  try {
    const rawJobs = await fetchPublicJobsFromHr();
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://apply.huptle.com").replace(/\/$/, "");

    const jobs = rawJobs.map((j) => ({
      id: j.id,
      title: j.title,
      department: j.dept,
      location: j.location,
      mode: j.mode,
      description: j.description,
      screeningDurationMin: j.screeningDurationMin,
      createdAt: j.createdAt,
      applyUrl: `${appUrl}/apply/${j.id}`,
      matchUrl: `${appUrl}/match`,
    }));

    return NextResponse.json(
      {
        success: true,
        count: jobs.length,
        jobs,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch jobs";
    console.error("[partner-jobs] Error:", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
