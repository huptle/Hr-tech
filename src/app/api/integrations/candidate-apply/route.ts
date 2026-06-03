import { NextResponse, type NextRequest } from "next/server";
import {
  upsertCandidateFromApply,
  type CandidateApplyPayload,
} from "@/lib/candidate-apply-sync";
import {
  authorizeIntegrationRequest,
  isIntegrationSecretConfigured,
} from "@/lib/integration-auth";

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

  let body: CandidateApplyPayload;
  try {
    body = (await req.json()) as CandidateApplyPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const result = await upsertCandidateFromApply(body);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Sync failed";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
