"use server";

import { DEFAULT_SCREENING_QUESTIONS } from "@/lib/default-screening-questions";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!title) return;

  const questionTexts = parseQuestionsFromForm(formData);

  const job = await prisma.job.create({
    data: {
      title,
      description,
      questions: {
        create: questionTexts.map((text, order) => ({
          order,
          text,
        })),
      },
    },
  });

  revalidatePath("/jobs");
  revalidatePath("/");
  redirect(`/jobs/${job.id}`);
}

export async function updateJob(jobId: string, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const durationRaw = String(formData.get("screeningDurationMin") ?? "15");
  const screeningDurationMin = Math.min(
    120,
    Math.max(5, parseInt(durationRaw, 10) || 15),
  );
  if (!title) return;

  await prisma.job.update({
    where: { id: jobId },
    data: { title, description, screeningDurationMin },
  });

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/jobs");
  revalidatePath("/");
}
