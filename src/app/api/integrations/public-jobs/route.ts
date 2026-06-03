import { NextResponse, type NextRequest } from "next/server";
import {
  authorizeIntegrationRequest,
  isIntegrationSecretConfigured,
} from "@/lib/integration-auth";
import { listPublicJobs } from "@/lib/public-jobs";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!isIntegrationSecretConfigured()) {
    return NextResponse.json(
      { error: "CANDIDATE_SYNC_SECRET is not configured on HR portal." },
      { status: 503 },
    );
  }

  if (!authorizeIntegrationRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const jobs = await listPublicJobs();
  return NextResponse.json({ ok: true, jobs });
}
