"use server";

import { DEFAULT_SCREENING_QUESTIONS } from "@/lib/default-screening-questions";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

function parseQuestionsFromForm(formData: FormData): string[] {
  const raw = String(formData.get("questionsJson") ?? "").trim();
  if (!raw) return [...DEFAULT_SCREENING_QUESTIONS];
  try {
    const arr = JSON.parse(raw) as unknown;
    if (
      Array.isArray(arr) &&
      arr.every((x) => typeof x === "string") &&
      arr.length >= 3
    ) {
      return (arr as string[]).map((t) => t.trim()).filter(Boolean).slice(0, 15);
    }
  } catch {
    /* ignore */
  }
  return [...DEFAULT_SCREENING_QUESTIONS];
}

export async function createJob(formData: FormData) {
  const user = await requireUser();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const dept = String(formData.get("dept") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const mode = String(formData.get("mode") ?? "Remote").trim();
  const status = String(formData.get("status") ?? "Live").trim();
  if (!title) return;

  const questionTexts = parseQuestionsFromForm(formData);

  const job = await prisma.job.create({
    data: {
      title,
      description,
      dept,
      location,
      mode,
      status,
      questions: {
        create: questionTexts.map((text, order) => ({
          order,
          text,
        })),
      },
    },
  });

  await logActivity({
    tag: "job",
    what: `Posted a new job: ${title}.`,
    actorId: user.id,
    jobId: job.id,
  });

  revalidatePath("/jobs");
  revalidatePath("/");
  redirect(`/jobs/${job.id}`);
}

export async function updateJob(jobId: string, formData: FormData) {
  await requireUser();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const durationRaw = String(formData.get("screeningDurationMin") ?? "15");
  const screeningDurationMin = Math.min(
    120,
    Math.max(5, parseInt(durationRaw, 10) || 15),
  );
  if (!title) return;

  const dept = String(formData.get("dept") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const mode = String(formData.get("mode") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();

  await prisma.job.update({
    where: { id: jobId },
    data: {
      title,
      description,
      screeningDurationMin,
      ...(dept ? { dept } : {}),
      ...(location ? { location } : {}),
      ...(mode ? { mode } : {}),
      ...(status ? { status } : {}),
    },
  });

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/jobs");
  revalidatePath("/");
}

export async function deleteJob(jobId: string) {
  const user = await requireUser();
  const job = await prisma.job.findUnique({ where: { id: jobId }, select: { title: true } });
  await prisma.job.delete({ where: { id: jobId } });
  await logActivity({
    tag: "job",
    what: `Deleted job: ${job?.title ?? jobId}.`,
    actorId: user.id,
  });
  revalidatePath("/jobs");
  revalidatePath("/");
  redirect("/jobs");
}
