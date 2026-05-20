import { NextResponse, type NextRequest } from "next/server";
import {
  upsertCandidateFromApply,
  type CandidateApplyPayload,
} from "@/lib/candidate-apply-sync";

export const runtime = "nodejs";

function authorize(req: NextRequest): boolean {
  const secret = process.env.CANDIDATE_SYNC_SECRET?.trim();
  if (!secret) return false;
  const header =
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    req.headers.get("x-candidate-sync-secret");
  return header === secret;
}

export async function POST(req: NextRequest) {
  if (!process.env.CANDIDATE_SYNC_SECRET?.trim()) {
    return NextResponse.json(
      { error: "CANDIDATE_SYNC_SECRET is not configured on HR portal." },
      { status: 503 },
    );
  }

  if (!authorize(req)) {
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
