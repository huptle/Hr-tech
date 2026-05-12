"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

function parseSlotTimes(formData: FormData): {
  startsAt: Date;
  endsAt: Date;
} | null {
  const startStr = String(formData.get("startsAt") ?? "");
  const durationMin = parseInt(
    String(formData.get("durationMin") ?? "30"),
    10,
  );
  if (!startStr) return null;
  const startsAt = new Date(startStr);
  if (Number.isNaN(startsAt.getTime())) return null;
  const endsAt = new Date(
    startsAt.getTime() + (durationMin || 30) * 60 * 1000,
  );
  return { startsAt, endsAt };
}

export async function createInterviewSlot(jobId: string, formData: FormData) {
  const user = await requireUser();
  const parsed = parseSlotTimes(formData);
  if (!parsed) return;
  const mode = String(formData.get("mode") ?? "hr");
  const safeMode = mode === "ai" ? "ai" : "hr";

  await prisma.interviewSlot.create({
    data: {
      jobId,
      startsAt: parsed.startsAt,
      endsAt: parsed.endsAt,
      mode: safeMode,
    },
  });

  await logActivity({
    tag: "interview",
    what: `Created a new ${safeMode === "ai" ? "AI" : "HR"} interview slot.`,
    actorId: user.id,
    jobId,
  });

  revalidatePath(`/jobs/${jobId}/schedule`);
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/schedule");
  revalidatePath("/");
}

export async function assignSlotToCandidate(
  slotId: string,
  jobId: string,
  formData: FormData,
) {
  const user = await requireUser();
  const candidateId = String(formData.get("candidateId") ?? "").trim();
  if (!candidateId) {
    await prisma.interviewSlot.update({
      where: { id: slotId },
      data: { candidateId: null },
    });
  } else {
    await prisma.interviewSlot.update({
      where: { id: slotId },
      data: { candidateId },
    });
    const cand = await prisma.candidate.update({
      where: { id: candidateId },
      data: { status: "scheduled", journey: "Round 1" },
    });
    await logActivity({
      tag: "interview",
      what: `${cand.name} was scheduled for an interview.`,
      actorId: user.id,
      candidateId,
      jobId,
    });
  }

  revalidatePath(`/jobs/${jobId}/schedule`);
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath(`/jobs/${jobId}/shortlist`);
  revalidatePath("/schedule");
  revalidatePath("/");
}

export async function deleteInterviewSlot(slotId: string, jobId: string) {
  await requireUser();
  await prisma.interviewSlot.delete({ where: { id: slotId } });
  revalidatePath(`/jobs/${jobId}/schedule`);
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/schedule");
  revalidatePath("/");
}
