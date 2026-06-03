import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { logActivity } from "@/lib/activity";
import {
  bookHrInterviewFromCall,
  parseAvailabilityFromTranscript,
} from "@/lib/scheduling-from-call";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function verifyWebhook(req: NextRequest): boolean {
  const secret = process.env.VAPI_WEBHOOK_SECRET?.trim();
  if (!secret) return true;
  const header =
    req.headers.get("x-vapi-secret") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return header === secret;
}

function extractTranscript(payload: Record<string, unknown>): string {
  const message = payload.message as Record<string, unknown> | undefined;
  if (message?.transcript && typeof message.transcript === "string") {
    return message.transcript;
  }
  if (message?.artifact && typeof message.artifact === "object") {
    const art = message.artifact as Record<string, unknown>;
    if (typeof art.transcript === "string") return art.transcript;
    if (Array.isArray(art.messages)) {
      return (art.messages as Array<{ role?: string; message?: string }>)
        .map((m) => `${m.role ?? "user"}: ${m.message ?? ""}`)
        .join("\n");
    }
  }
  if (typeof payload.transcript === "string") return payload.transcript;
  return "";
}

function extractCallId(payload: Record<string, unknown>): string | null {
  const message = payload.message as Record<string, unknown> | undefined;
  if (message?.call && typeof message.call === "object") {
    const call = message.call as { id?: string };
    if (call.id) return call.id;
  }
  if (typeof payload.call === "object" && payload.call) {
    const call = payload.call as { id?: string };
    if (call.id) return call.id;
  }
  if (typeof payload.id === "string") return payload.id;
  return null;
}

export async function POST(req: NextRequest) {
  if (!verifyWebhook(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType =
    (payload.message as { type?: string } | undefined)?.type ||
    (payload.type as string | undefined) ||
    "";

  const endTypes = new Set(["end-of-call-report", "call-ended"]);

  if (eventType && !endTypes.has(eventType)) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const vapiCallId = extractCallId(payload);
  if (!vapiCallId) {
    return NextResponse.json({ ok: true, note: "no call id" });
  }

  const callRow = await prisma.schedulingCall.findFirst({
    where: { vapiCallId },
    include: {
      candidate: { include: { job: true } },
      campaign: true,
    },
  });

  if (!callRow) {
    return NextResponse.json({ ok: true, note: "unknown call" });
  }

  if (callRow.status === "completed" || callRow.status === "booked") {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const transcript = extractTranscript(payload);
  if (!transcript.trim()) {
    await prisma.schedulingCall.update({
      where: { id: callRow.id },
      data: { status: "completed", errorMessage: "No transcript received." },
    });
    return NextResponse.json({ ok: true, note: "empty transcript" });
  }

  const parsed = await parseAvailabilityFromTranscript(
    transcript,
    callRow.candidate.job.title,
    callRow.candidate.name,
  );

  const booking = await bookHrInterviewFromCall({
    jobId: callRow.candidate.jobId,
    candidateId: callRow.candidateId,
    hrUserId: callRow.campaign.actorId,
    parsed,
  });

  await prisma.schedulingCall.update({
    where: { id: callRow.id },
    data: {
      status: booking.slotId ? "booked" : "completed",
      transcript: transcript.slice(0, 20000),
      parsedAvailability: JSON.stringify(parsed).slice(0, 12000),
      bookedSlotId: booking.slotId,
      errorMessage: booking.slotId ? "" : booking.message,
    },
  });

  await logActivity({
    tag: "interview",
    what: booking.slotId
      ? `AI call with ${callRow.candidate.name}: ${booking.message}`
      : `AI call with ${callRow.candidate.name} ended — ${booking.message}`,
    actorId: callRow.campaign.actorId,
    candidateId: callRow.candidateId,
    jobId: callRow.candidate.jobId,
  });

  revalidatePath(`/jobs/${callRow.candidate.jobId}/schedule`);
  revalidatePath(`/jobs/${callRow.candidate.jobId}`);

  return NextResponse.json({ ok: true, booked: Boolean(booking.slotId) });
}
