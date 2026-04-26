"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createCandidate(jobId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const resumeNotes = String(formData.get("resumeNotes") ?? "").trim();
  const joiningAvailability = String(
    formData.get("joiningAvailability") ?? "",
  ).trim();
  if (!name || !email) return;

  await prisma.candidate.create({
    data: {
      jobId,
      name,
      email,
      phone,
      resumeNotes,
      joiningAvailability,
      status: "imported",
    },
  });

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath(`/jobs/${jobId}/shortlist`);
  revalidatePath(`/jobs/${jobId}/schedule`);
  revalidatePath("/");
}

export async function deleteCandidate(candidateId: string, jobId: string) {
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
  await prisma.candidate.updateMany({
    where: { jobId, status: "selected" },
    data: { status: "shortlisted" },
  });
  await prisma.candidate.update({
    where: { id: candidateId },
    data: { status: "selected" },
  });
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath(`/jobs/${jobId}/shortlist`);
  revalidatePath("/");
}
