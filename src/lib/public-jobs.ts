import "server-only";

import { geminiGenerateJson, isGeminiConfigured } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";
type ParsedResumeShape = {
  workExperience?: Array<{ role?: string; company?: string }>;
};

export type PublicJobListing = {
  id: string;
  title: string;
  description: string;
  dept: string;
  location: string;
  mode: string;
  screeningDurationMin: number;
  createdAt: string;
};

export type JobRecommendation = {
  jobId: string;
  title: string;
  matchScore: number;
  reason: string;
};

const DESCRIPTION_PREVIEW_LEN = 480;

function previewDescription(text: string): string {
  const t = text.trim();
  if (t.length <= DESCRIPTION_PREVIEW_LEN) return t;
  return `${t.slice(0, DESCRIPTION_PREVIEW_LEN).trim()}…`;
}

export async function listPublicJobs(): Promise<PublicJobListing[]> {
  const rows = await prisma.job.findMany({
    where: { status: "Live" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      dept: true,
      location: true,
      mode: true,
      screeningDurationMin: true,
      createdAt: true,
    },
  });

  return rows.map((j) => ({
    id: j.id,
    title: j.title,
    description: previewDescription(j.description),
    dept: j.dept,
    location: j.location,
    mode: j.mode,
    screeningDurationMin: j.screeningDurationMin,
    createdAt: j.createdAt.toISOString(),
  }));
}

type RecommendPayload = {
  email?: string;
  name?: string;
  summary?: string;
  skills?: string[];
  location?: string;
  parsedData?: unknown;
};

function buildCandidateSummary(input: RecommendPayload): string {
  const parts: string[] = [];
  if (input.name?.trim()) parts.push(`Name: ${input.name.trim()}`);
  if (input.email?.trim()) parts.push(`Email: ${input.email.trim()}`);
  if (input.location?.trim()) parts.push(`Location: ${input.location.trim()}`);
  if (input.summary?.trim()) parts.push(`Summary: ${input.summary.trim()}`);
  if (input.skills?.length) {
    parts.push(`Skills: ${input.skills.slice(0, 40).join(", ")}`);
  }
  if (input.parsedData && typeof input.parsedData === "object") {
    const p = input.parsedData as ParsedResumeShape;
    const work = Array.isArray(p.workExperience) ? p.workExperience : [];
    for (const w of work.slice(0, 6)) {
      if (w && typeof w === "object") {
        const row = w as { role?: string; company?: string };
        const role = String(row.role ?? "").trim();
        const company = String(row.company ?? "").trim();
        if (role || company) parts.push(`Experience: ${role} @ ${company}`);
      }
    }
  }
  return parts.join("\n").slice(0, 8000);
}

export async function recommendJobsForCandidate(
  input: RecommendPayload,
  limit = 8,
): Promise<JobRecommendation[]> {
  const jobs = await listPublicJobs();
  if (jobs.length === 0) return [];

  const candidateBlock = buildCandidateSummary(input);
  if (!candidateBlock.trim()) {
    throw new Error("Resume profile is empty; upload a valid resume first.");
  }

  if (!isGeminiConfigured()) {
    return jobs.slice(0, limit).map((j) => ({
      jobId: j.id,
      title: j.title,
      matchScore: 50,
      reason: "AI matching is not configured on the HR server.",
    }));
  }

  const jobBlock = jobs
    .map(
      (j) =>
        `id=${j.id}\ntitle=${j.title}\ndept=${j.dept}\nlocation=${j.location}\nmode=${j.mode}\ndescription=${j.description}`,
    )
    .join("\n---\n");

  const prompt = `You are a career matching assistant. Rank the best job openings for this candidate.

Candidate profile:
${candidateBlock}

Open jobs:
${jobBlock}

Return JSON:
{
  "recommendations": [
    {
      "jobId": string (must match a job id exactly),
      "matchScore": number (0-100 integer),
      "reason": string (one sentence why this role fits)
    }
  ]
}

Return up to ${limit} jobs, best match first. Only include job ids from the list. If none fit well, still return the top 3 with lower scores and honest reasons.`;

  const parsed = await geminiGenerateJson<{
    recommendations: JobRecommendation[];
  }>(prompt);

  const byId = new Map(jobs.map((j) => [j.id, j.title]));
  const seen = new Set<string>();
  const out: JobRecommendation[] = [];

  for (const r of parsed.recommendations ?? []) {
    const jobId = String(r.jobId ?? "").trim();
    if (!byId.has(jobId) || seen.has(jobId)) continue;
    seen.add(jobId);
    out.push({
      jobId,
      title: byId.get(jobId) ?? String(r.title ?? "Role"),
      matchScore: Math.min(100, Math.max(0, Math.round(Number(r.matchScore) || 0))),
      reason: String(r.reason ?? "").slice(0, 500),
    });
    if (out.length >= limit) break;
  }

  return out;
}
