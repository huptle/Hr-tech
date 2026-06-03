import type { ResumeData } from "./resume.types";

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

function hrBaseAndSecret(): { base: string; secret: string } | null {
  const base =
    process.env.HR_PORTAL_INTERNAL_URL?.trim() ||
    process.env.HR_PORTAL_URL?.trim();
  const secret = process.env.CANDIDATE_SYNC_SECRET?.trim();
  if (!base || !secret) return null;
  return { base: base.replace(/\/$/, ""), secret };
}

async function hrFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const cfg = hrBaseAndSecret();
  if (!cfg) {
    const base =
      process.env.HR_PORTAL_INTERNAL_URL?.trim() ||
      process.env.HR_PORTAL_URL?.trim();
    const secret = process.env.CANDIDATE_SYNC_SECRET?.trim();
    if (!secret) {
      throw new Error(
        "CANDIDATE_SYNC_SECRET is missing in the apply portal .env (must match the HR app).",
      );
    }
    if (!base) {
      throw new Error(
        "HR_PORTAL_INTERNAL_URL is missing (use http://app:3000 inside Docker).",
      );
    }
    throw new Error("HR portal connection is not configured.");
  }

  const res = await fetch(`${cfg.base}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.secret}`,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const text = await res.text();
  let json: { error?: string; jobs?: PublicJobListing[]; recommendations?: JobRecommendation[] };
  try {
    json = JSON.parse(text) as typeof json;
  } catch {
    throw new Error(`HR API error (${res.status}): invalid JSON`);
  }

  if (!res.ok) {
    throw new Error(json.error ?? `HR API error (${res.status})`);
  }

  return json as T;
}

export async function fetchPublicJobsFromHr(): Promise<PublicJobListing[]> {
  const data = await hrFetch<{ ok: boolean; jobs: PublicJobListing[] }>(
    "/api/integrations/public-jobs",
  );
  return data.jobs ?? [];
}

export async function fetchJobRecommendations(
  parsed: ResumeData,
  limit = 8,
): Promise<JobRecommendation[]> {
  const data = await hrFetch<{
    ok: boolean;
    recommendations: JobRecommendation[];
  }>("/api/integrations/job-recommendations", {
    method: "POST",
    body: JSON.stringify({
      email: parsed.userInfo.email,
      name: parsed.userInfo.name,
      summary: parsed.userInfo.summary,
      skills: parsed.userInfo.skills,
      location: parsed.userInfo.location,
      parsedData: parsed,
      limit,
    }),
  });
  return data.recommendations ?? [];
}
