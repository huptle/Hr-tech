import { NextResponse, type NextRequest } from "next/server";
import {
  authorizeIntegrationRequest,
  isIntegrationSecretConfigured,
} from "@/lib/integration-auth";
import { recommendJobsForCandidate } from "@/lib/public-jobs";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!isIntegrationSecretConfigured()) {
    return NextResponse.json(
      { error: "CANDIDATE_SYNC_SECRET is not configured on HR portal." },
      { status: 503 },
    );
  }

  if (!authorizeIntegrationRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    email?: string;
    name?: string;
    summary?: string;
    skills?: string[];
    location?: string;
    parsedData?: unknown;
    limit?: number;
  };

  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const limit = Math.min(15, Math.max(1, Number(body.limit) || 8));
    const recommendations = await recommendJobsForCandidate(body, limit);
    return NextResponse.json({ ok: true, recommendations });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Recommendation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
