import "server-only";

import type { Prisma } from "@prisma/client";
import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/prisma";

/** Payload from candidate apply portal (HUPTLE_userpfp). */
export type CandidateApplyPayload = {
  jobId: string;
  email: string;
  name: string;
  phone?: string | null;
  location?: string | null;
  resumeUrl?: string | null;
  summary?: string | null;
  skills?: string[];
  parsedData?: unknown;
  externalProfileId?: string | null;
};

function buildResumeNotes(input: CandidateApplyPayload): string {
  const parts: string[] = [];
  if (input.summary?.trim()) parts.push(input.summary.trim());
  if (input.skills?.length) {
    parts.push(`Skills: ${input.skills.slice(0, 40).join(", ")}`);
  }
  if (input.parsedData && typeof input.parsedData === "object") {
    const p = input.parsedData as Record<string, unknown>;
    const work = Array.isArray(p.workExperience) ? p.workExperience : [];
    for (const w of work.slice(0, 5)) {
      if (w && typeof w === "object") {
        const row = w as Record<string, unknown>;
        const company = String(row.company ?? "").trim();
        const role = String(row.role ?? "").trim();
        if (company || role) parts.push(`${role} @ ${company}`.trim());
      }
    }
  }
  return parts.join("\n").slice(0, 12_000);
}

export async function upsertCandidateFromApply(
  payload: CandidateApplyPayload,
): Promise<{ candidateId: string; created: boolean }> {
  const jobId = payload.jobId.trim();
  const email = payload.email.trim().toLowerCase();
  const name = payload.name.trim();
  if (!jobId || !email || !name) {
    throw new Error("jobId, email, and name are required.");
  }

  const job = await prisma.job.findFirst({
    where: { id: jobId, status: { in: ["Live", "Draft"] } },
    select: { id: true, title: true, createdById: true },
  });
  if (!job) {
    throw new Error("Job not found or not open for applications.");
  }

  const resumeNotes = buildResumeNotes(payload);
  const parsedDataJson =
    payload.parsedData != null
      ? JSON.stringify(payload.parsedData).slice(0, 120_000)
      : "";

  const data: Prisma.CandidateUncheckedCreateInput = {
    jobId,
    name,
    email,
    phone: payload.phone?.trim() || null,
    location: payload.location?.trim() || "",
    resumeNotes,
    resumeUrl: payload.resumeUrl?.trim() || "",
    externalProfileId: payload.externalProfileId?.trim() || "",
    parsedDataJson,
    status: "imported",
    journey: "Applied",
  };

  const existing = await prisma.candidate.findUnique({
    where: { jobId_email: { jobId, email } },
    select: { id: true },
  });

  if (existing) {
    const updated = await prisma.candidate.update({
      where: { id: existing.id },
      data: {
        name: data.name,
        phone: data.phone,
        location: data.location,
        resumeNotes: data.resumeNotes,
        resumeUrl: data.resumeUrl,
        externalProfileId: data.externalProfileId,
        parsedDataJson: data.parsedDataJson,
        journey: "Applied",
      },
    });
    return { candidateId: updated.id, created: false };
  }

  const created = await prisma.candidate.create({ data });

  await logActivity({
    tag: "new",
    what: `${name} applied via candidate portal.`,
    actorId: job.createdById,
    candidateId: created.id,
    jobId,
  });

  return { candidateId: created.id, created: true };
}
