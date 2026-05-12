"use server";

import { isGeminiConfigured } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { runGeminiVoiceScreening } from "./ai";
import { requireUser } from "@/lib/auth";

/** Random scores when no Gemini key — keeps UI usable. */
async function simulateVoiceScreeningFallback(jobId: string) {
  const pending = await prisma.candidate.findMany({
    where: { jobId, rankScore: null },
  });

  for (const c of pending) {
    const rankScore = Math.round(60 + Math.random() * 38);
    const resumeVerified = Math.random() > 0.15;
    await prisma.candidate.update({
      where: { id: c.id },
      data: {
        rankScore,
        resumeVerified,
        status: "screened",
        voiceTranscriptNotes:
          "Simulated transcript: answered screening questions; follow up in real integration via voice webhook.",
        aiSummary: "",
      },
    });
  }
}

/**
 * Uses Gemini when `GEMINI_API_KEY` is set; otherwise simulates scores.
 */
export async function runVoiceScreening(jobId: string) {
  await requireUser();
  if (isGeminiConfigured()) {
    await runGeminiVoiceScreening(jobId);
  } else {
    await simulateVoiceScreeningFallback(jobId);
  }

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath(`/jobs/${jobId}/shortlist`);
  revalidatePath(`/jobs/${jobId}/schedule`);
  revalidatePath("/");
}
