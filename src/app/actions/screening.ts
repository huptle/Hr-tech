"use server";

import { isGeminiConfigured } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { runGeminiVoiceScreening } from "./ai";
import { requireUser } from "@/lib/auth";
import { assertJobAccess, scopeFromUser } from "@/lib/hr-scope";

export type ScreeningResult = { ok: boolean; message: string };

/** Random scores when no Gemini key — keeps UI usable. */
async function simulateVoiceScreeningFallback(
  jobId: string,
  rescoreAll: boolean,
): Promise<ScreeningResult> {
  const pending = await prisma.candidate.findMany({
    where: rescoreAll ? { jobId } : { jobId, rankScore: null },
  });

  if (pending.length === 0) {
    return {
      ok: false,
      message: rescoreAll
        ? "No candidates on this job."
        : "No unscored candidates. Use “Re-run screening” to refresh all scores.",
    };
  }

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

  return {
    ok: true,
    message: `Simulated screening for ${pending.length} candidate(s). Add GEMINI_API_KEY for real AI scores.`,
  };
}

/**
 * Uses Gemini when `GEMINI_API_KEY` is set; otherwise simulates scores.
 * @param rescoreAll — when true, re-score every candidate (not only unscored).
 */
export async function runVoiceScreening(
  jobId: string,
  rescoreAll = false,
): Promise<ScreeningResult> {
  try {
    const user = await requireUser();
    await assertJobAccess(jobId, scopeFromUser(user));

    const result = isGeminiConfigured()
      ? await runGeminiVoiceScreening(jobId, rescoreAll)
      : await simulateVoiceScreeningFallback(jobId, rescoreAll);

    revalidatePath(`/jobs/${jobId}`);
    revalidatePath(`/jobs/${jobId}/shortlist`);
    revalidatePath(`/jobs/${jobId}/schedule`);
    revalidatePath("/");

    return result;
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Screening failed. Check server logs.";
    return { ok: false, message };
  }
}

/** For client forms with useActionState */
export async function runVoiceScreeningForm(
  _prev: ScreeningResult | null,
  formData: FormData,
): Promise<ScreeningResult> {
  const jobId = String(formData.get("jobId") ?? "").trim();
  const rescoreAll = formData.get("rescoreAll") === "1";
  if (!jobId) return { ok: false, message: "Missing job id." };
  return runVoiceScreening(jobId, rescoreAll);
}
