"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function createCandidate(jobId: string, formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const location = String(formData.get("location") ?? "").trim();
  const resumeNotes = String(formData.get("resumeNotes") ?? "").trim();
  const joiningAvailability = String(
    formData.get("joiningAvailability") ?? "",
  ).trim();
  if (!name || !email) return;

  const cand = await prisma.candidate.create({
    data: {
      jobId,
      name,
      email,
      phone,
      location,
      resumeNotes,
      joiningAvailability,
      status: "imported",
      journey: "Applied",
    },
  });

  await logActivity({
    tag: "new",
    what: `${name} was added to the pipeline.`,
    actorId: user.id,
    candidateId: cand.id,
    jobId,
  });

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath(`/jobs/${jobId}/shortlist`);
  revalidatePath(`/jobs/${jobId}/schedule`);
  revalidatePath("/");
}

export async function deleteCandidate(candidateId: string, jobId: string) {
  await requireUser();
  await prisma.candidate.delete({ where: { id: candidateId } });
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath(`/jobs/${jobId}/shortlist`);
  revalidatePath(`/jobs/${jobId}/schedule`);
  revalidatePath("/");
}

export async function markCandidateSelected(
  candidateId: string,
  jobId: string,
) {
  const user = await requireUser();
  await prisma.candidate.updateMany({
    where: { jobId, status: "selected" },
    data: { status: "shortlisted", journey: "Shortlisted" },
  });
  const cand = await prisma.candidate.update({
    where: { id: candidateId },
    data: { status: "selected", journey: "Offer Sent" },
  });

  await logActivity({
    tag: "hired",
    what: `${cand.name} was marked as the selected hire.`,
    actorId: user.id,
    candidateId,
    jobId,
  });

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath(`/jobs/${jobId}/shortlist`);
  revalidatePath("/");
  revalidatePath("/shortlist");
}

export async function updateCandidateJourney(
  candidateId: string,
  journey: string,
) {
  const user = await requireUser();
  const cand = await prisma.candidate.update({
    where: { id: candidateId },
    data: { journey },
  });

  const lower = journey.toLowerCase();
  const tag = lower.includes("offer accepted") || lower.includes("hired")
    ? "hired"
    : lower.includes("reject")
      ? "rejected"
      : lower.includes("round") || lower.includes("interview")
        ? "interview"
        : "new";

  await logActivity({
    tag,
    what: `${cand.name} moved to ${journey}.`,
    actorId: user.id,
    candidateId,
    jobId: cand.jobId,
  });

  revalidatePath("/");
  revalidatePath("/shortlist");
  revalidatePath(`/jobs/${cand.jobId}`);
}
