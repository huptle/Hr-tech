"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import {
  assertJobAccess,
  candidateWhereOwned,
  jobWhereOwned,
  scopeFromUser,
} from "@/lib/hr-scope";
import {
  geminiGenerateJson,
  geminiGenerateText,
  isGeminiConfigured,
} from "@/lib/gemini";

async function guardJob(jobId: string) {
  const user = await requireUser();
  await assertJobAccess(jobId, scopeFromUser(user));
  return user;
}

function requireGemini() {
  if (!isGeminiConfigured()) {
    throw new Error(
      "AI is not configured. Add GEMINI_API_KEY to .env.local and restart the dev server.",
    );
  }
}

// ─── New job: JD + screening questions from rough notes ─────────────────────

export async function generateNewJobDraft(title: string, roughNotes: string) {
  requireGemini();
  const t = title.trim();
  const notes = roughNotes.trim();
  if (!t) throw new Error("Title is required");

  const prompt = `You help HR write job postings and voice-screening questions.

Job title: ${t}
Hiring manager rough notes (may be bullets or messy):
${notes || "(none — infer a sensible JD from the title alone)"}

Return JSON with this exact shape:
{
  "description": string (a polished job description, 2–5 short paragraphs, markdown plain paragraphs only, no HTML),
  "questions": string[] (exactly 10 concise voice-screening questions tailored to this role; each one line, no numbering prefix)
}`;

  const out = await geminiGenerateJson<{
    description: string;
    questions: string[];
  }>(prompt);

  if (!Array.isArray(out.questions) || out.questions.length < 5) {
    throw new Error("Invalid questions from model");
  }
  const questions = out.questions
    .filter((q) => typeof q === "string" && q.trim())
    .map((q) => q.trim())
    .slice(0, 12);

  return {
    description: String(out.description ?? "").trim(),
    questions,
  };
}

// ─── Polish existing JD (returns text; caller updates form or saves) ────────

export async function polishJobDescriptionDraft(jobId: string) {
  requireGemini();
  await guardJob(jobId);
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new Error("Job not found");

  const prompt = `Rewrite and polish this job description for clarity and inclusivity. Keep facts; improve structure and tone. Output plain paragraphs only (no JSON, no markdown headings).

Title: ${job.title}

Current description:
${job.description || "(empty)"}`;

  return await geminiGenerateText(prompt);
}

// ─── Replace all screening questions for a job ──────────────────────────────

export async function replaceJobScreeningQuestionsWithAi(jobId: string) {
  requireGemini();
  await guardJob(jobId);
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  if (!job) throw new Error("Job not found");

  const existing = job.questions.map((q) => q.text).join("\n");

  const prompt = `Job title: ${job.title}
Job description:
${job.description || "(none)"}

Existing screening questions (replace with a better set):
${existing || "(none)"}

Return JSON: { "questions": string[] } with exactly 10 new voice-screening questions, tailored to this role.`;

  const out = await geminiGenerateJson<{ questions: string[] }>(prompt);
  const list = (out.questions ?? [])
    .filter((q) => typeof q === "string" && q.trim())
    .map((q) => q.trim())
    .slice(0, 12);
  if (list.length < 5) throw new Error("Too few questions from model");

  await prisma.$transaction([
    prisma.screeningQuestion.deleteMany({ where: { jobId } }),
    prisma.screeningQuestion.createMany({
      data: list.map((text, order) => ({ jobId, order, text })),
    }),
  ]);

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/jobs");
  revalidatePath("/");
}

// ─── Batch screening scores (Gemini) ────────────────────────────────────────

type ScreeningBatch = {
  results: Array<{
    candidateId: string;
    rankScore: number;
    resumeVerified: boolean;
    voiceTranscriptNotes: string;
    aiSummary: string;
  }>;
};

export async function runGeminiVoiceScreening(
  jobId: string,
  rescoreAll = false,
): Promise<{ ok: boolean; message: string }> {
  requireGemini();
  await guardJob(jobId);
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      questions: { orderBy: { order: "asc" } },
      candidates: rescoreAll
        ? { orderBy: { createdAt: "asc" } }
        : { where: { rankScore: null }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!job) throw new Error("Job not found");
  if (job.candidates.length === 0) {
    return {
      ok: false,
      message: rescoreAll
        ? "No candidates on this job."
        : "No unscored candidates. Use “Re-run screening” to refresh all scores with AI.",
    };
  }

  const qText = job.questions.map((q, i) => `${i + 1}. ${q.text}`).join("\n");
  const candBlock = job.candidates
    .map(
      (c) =>
        `id=${c.id}\nname=${c.name}\nemail=${c.email}\nresumeNotes=${c.resumeNotes || "—"}\njoiningAvailability=${c.joiningAvailability || "—"}`,
    )
    .join("\n---\n");

  const prompt = `You are an HR screening analyst. Score each candidate for fit to this role using only the text provided (simulate what you'd infer from a first screen).

Job title: ${job.title}
Job description:
${job.description || "—"}

Screening questions they would have been asked:
${qText}

Candidates:
${candBlock}

Return JSON:
{
  "results": [
    {
      "candidateId": string (must match exactly),
      "rankScore": number (0-100 integer fit score),
      "resumeVerified": boolean (true if resume notes look coherent and role-relevant; false if empty, contradictory, or spammy),
      "voiceTranscriptNotes": string (2-4 sentences: strengths, gaps, follow-up suggestions — written as if after a screening call),
      "aiSummary": string (one short paragraph for the hiring manager panel)
    }
  ]
}
Include every candidate id exactly once.`;

  const parsed = await geminiGenerateJson<ScreeningBatch>(prompt);
  const byId = new Map(parsed.results.map((r) => [r.candidateId, r]));

  for (const c of job.candidates) {
    const r = byId.get(c.id);
    if (!r) continue;
    const rankScore = Math.min(100, Math.max(0, Math.round(Number(r.rankScore) || 0)));
    await prisma.candidate.update({
      where: { id: c.id },
      data: {
        rankScore,
        resumeVerified: Boolean(r.resumeVerified),
        status: "screened",
        voiceTranscriptNotes: String(r.voiceTranscriptNotes || "").slice(0, 4000),
        aiSummary: String(r.aiSummary || "").slice(0, 2000),
      },
    });
  }

  return { ok: true, message: `Scored ${job.candidates.length} candidate(s) with AI.` };
}

// ─── Shortlist: compare top candidates ───────────────────────────────────────

export async function generateShortlistComparison(jobId: string) {
  requireGemini();
  await guardJob(jobId);
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      candidates: {
        where: { rankScore: { not: null } },
        orderBy: { rankScore: "desc" },
        take: 10,
      },
    },
  });
  if (!job) throw new Error("Job not found");
  if (job.candidates.length === 0) throw new Error("No scored candidates yet.");

  const rows = job.candidates
    .map(
      (c) =>
        `${c.name} (score ${Math.round(c.rankScore!)}): ${c.aiSummary || c.voiceTranscriptNotes || "—"} | resume: ${c.resumeNotes || "—"} | joining: ${c.joiningAvailability || "—"}`,
    )
    .join("\n");

  const prompt = `Role: ${job.title}
${job.description ? `JD summary:\n${job.description.slice(0, 2000)}` : ""}

Ranked candidates:
${rows}

Write a concise comparison for the hiring panel: tradeoffs, who to advance first, risks, and 3–5 bullet recommendations. Plain text, no JSON.`;

  return await geminiGenerateText(prompt);
}

// ─── Per-candidate manager blurb (refresh) ────────────────────────────────────

export async function refreshCandidateAiSummary(candidateId: string, jobId: string) {
  requireGemini();
  const user = await guardJob(jobId);
  const scope = scopeFromUser(user);
  const c = await prisma.candidate.findFirst({
    where: { id: candidateId, jobId, ...candidateWhereOwned(scope) },
    include: { job: { include: { questions: { orderBy: { order: "asc" } } } } },
  });
  if (!c) throw new Error("Candidate not found");

  const prompt = `Write one tight paragraph (manager panel summary) for this candidate vs the role.

Role: ${c.job.title}
Job context: ${c.job.description?.slice(0, 1500) || "—"}
Screening notes / transcript summary: ${c.voiceTranscriptNotes || "—"}
Resume notes: ${c.resumeNotes || "—"}
Joining: ${c.joiningAvailability || "—"}
Current score (0-100): ${c.rankScore != null ? Math.round(c.rankScore) : "n/a"}

Output plain text only, one paragraph.`;

  const text = await geminiGenerateText(prompt);
  await prisma.candidate.update({
    where: { id: candidateId },
    data: { aiSummary: text.slice(0, 2000) },
  });
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath(`/jobs/${jobId}/shortlist`);
  return text;
}

// ─── Email drafts (not sent — copy/paste) ────────────────────────────────────

export async function draftInterviewInviteEmail(slotId: string, jobId: string) {
  requireGemini();
  await guardJob(jobId);
  const slot = await prisma.interviewSlot.findFirst({
    where: { id: slotId, jobId },
    include: { candidate: true, job: true },
  });
  if (!slot?.candidate) throw new Error("Slot needs an assigned candidate.");

  const mode = slot.mode === "ai" ? "AI-assisted" : "HR";
  const prompt = `Draft a professional interview invitation email body (subject line on first line as "Subject: ...", then blank line, then body).

To: ${slot.candidate.name} <${slot.candidate.email}>
Role: ${slot.job.title}
When: ${slot.startsAt.toISOString()} (mention local timezone phrasing politely)
Duration until: ${slot.endsAt.toISOString()}
Interview type: ${mode} interview
Tone: warm, concise. Include calendar placeholder line. No HTML.`;

  return await geminiGenerateText(prompt);
}

export async function draftRejectionEmail(candidateId: string, jobId: string) {
  requireGemini();
  const user = await guardJob(jobId);
  const scope = scopeFromUser(user);
  const c = await prisma.candidate.findFirst({
    where: { id: candidateId, jobId, ...candidateWhereOwned(scope) },
    include: { job: true },
  });
  if (!c) throw new Error("Candidate not found");

  const prompt = `Draft a respectful rejection email (Subject line first as "Subject: ...").

To: ${c.name} <${c.email}>
Role applied: ${c.job.title}
Keep it short, kind, no legal promises, encourage future roles. Plain text.`;

  return await geminiGenerateText(prompt);
}

export async function draftOfferEmail(candidateId: string, jobId: string) {
  requireGemini();
  const user = await guardJob(jobId);
  const scope = scopeFromUser(user);
  const c = await prisma.candidate.findFirst({
    where: { id: candidateId, jobId, ...candidateWhereOwned(scope) },
    include: { job: true },
  });
  if (!c) throw new Error("Candidate not found");

  const prompt = `Draft a conditional offer / next-steps email (Subject first as "Subject: ..."). Placeholder for compensation and start date — use [COMPENSATION] and [START_DATE].

To: ${c.name}
Role: ${c.job.title}
Professional, celebratory but cautious (mentions background check placeholder). Plain text.`;

  return await geminiGenerateText(prompt);
}

// ─── Overview copilot ───────────────────────────────────────────────────────

export async function recruitingCopilotAsk(userQuestion: string) {
  requireGemini();
  const user = await requireUser();
  const scope = scopeFromUser(user);
  const jobFilter = jobWhereOwned(scope);
  const candFilter = candidateWhereOwned(scope);
  const q = userQuestion.trim();
  if (!q) throw new Error("Enter a question.");

  const [jobCount, candCount, byStatus, recentJobs] = await Promise.all([
    prisma.job.count({ where: jobFilter }),
    prisma.candidate.count({ where: candFilter }),
    prisma.candidate.groupBy({
      by: ["status"],
      where: candFilter,
      _count: { id: true },
    }),
    prisma.job.findMany({
      where: jobFilter,
      take: 8,
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { candidates: true } } },
    }),
  ]);

  const statusLines = byStatus
    .map((s) => `${s.status}: ${s._count.id}`)
    .join(", ");
  const jobsLines = recentJobs
    .map((j) => `- ${j.title}: ${j._count.candidates} candidates`)
    .join("\n");

  const context = `Recruitment workspace snapshot:
- Jobs: ${jobCount}
- Candidates: ${candCount}
- Candidates by status: ${statusLines || "none"}
- Recent jobs:
${jobsLines || "(none)"}

Answer the recruiter's question using this data. If data is insufficient, say what is missing. Plain text, concise.`;

  const prompt = `${context}\n\nRecruiter question:\n${q}`;
  return await geminiGenerateText(prompt);
}

export async function recruitingFunnelInsight() {
  requireGemini();
  const user = await requireUser();
  const scope = scopeFromUser(user);
  const jobFilter = jobWhereOwned(scope);
  const candFilter = candidateWhereOwned(scope);
  const [jobCount, candCount, byStatus] = await Promise.all([
    prisma.job.count({ where: jobFilter }),
    prisma.candidate.count({ where: candFilter }),
    prisma.candidate.groupBy({
      by: ["status"],
      where: candFilter,
      _count: { id: true },
    }),
  ]);

  const statusLines = byStatus
    .map((s) => `${s.status}: ${s._count.id}`)
    .join("\n");

  const prompt = `You are a talent ops analyst. Given counts by candidate status, write 3–5 sentences on funnel health and the next best actions.

Total jobs: ${jobCount}
Total candidates: ${candCount}

Status breakdown:
${statusLines || "no candidates"}

Plain text, actionable.`;

  return await geminiGenerateText(prompt);
}

// ─── Async text screening: save answers + Gemini score ───────────────────────

export async function submitAsyncScreening(
  jobId: string,
  candidateId: string,
  payload: { question: string; answer: string }[],
) {
  requireGemini();
  const user = await guardJob(jobId);
  const scope = scopeFromUser(user);
  const job = await prisma.job.findFirst({
    where: { id: jobId, ...jobWhereOwned(scope) },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  const cand = await prisma.candidate.findFirst({
    where: { id: candidateId, jobId, ...candidateWhereOwned(scope) },
  });
  if (!job || !cand) throw new Error("Not found");

  const json = JSON.stringify(payload);

  const qaText = payload
    .map((p, i) => `Q${i + 1}: ${p.question}\nA: ${p.answer}`)
    .join("\n\n");

  const prompt = `Evaluate this async written screening for role "${job.title}".

Job description (excerpt):
${(job.description || "—").slice(0, 2500)}

Candidate: ${cand.name}
Resume notes: ${cand.resumeNotes || "—"}
Joining availability: ${cand.joiningAvailability || "—"}

Their answers:
${qaText}

Return JSON:
{
  "rankScore": number (0-100),
  "resumeVerified": boolean,
  "voiceTranscriptNotes": string (brief assessment of answers),
  "aiSummary": string (one paragraph for managers)
}`;

  const out = await geminiGenerateJson<{
    rankScore: number;
    resumeVerified: boolean;
    voiceTranscriptNotes: string;
    aiSummary: string;
  }>(prompt);

  const rankScore = Math.min(
    100,
    Math.max(0, Math.round(Number(out.rankScore) || 0)),
  );

  await prisma.candidate.update({
    where: { id: candidateId },
    data: {
      asyncScreeningAnswers: json.slice(0, 12000),
      rankScore,
      resumeVerified: Boolean(out.resumeVerified),
      status: "screened",
      voiceTranscriptNotes: String(out.voiceTranscriptNotes || "").slice(0, 4000),
      aiSummary: String(out.aiSummary || "").slice(0, 2000),
    },
  });

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath(`/jobs/${jobId}/shortlist`);
  revalidatePath(`/jobs/${jobId}/schedule`);
  revalidatePath(`/jobs/${jobId}/async-screen/${candidateId}`);
  return { ok: true as const };
}
