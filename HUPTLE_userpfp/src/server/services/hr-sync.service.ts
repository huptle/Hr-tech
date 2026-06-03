import type { ResumeData } from "./resume.types";

export type HrSyncInput = {
  jobId: string;
  parsed: ResumeData;
  resumeUrl: string;
  externalProfileId?: string;
};

export async function syncCandidateToHrPortal(input: HrSyncInput): Promise<void> {
  const base =
    process.env.HR_PORTAL_INTERNAL_URL?.trim() ||
    process.env.HR_PORTAL_URL?.trim();
  const secret = process.env.CANDIDATE_SYNC_SECRET?.trim();

  if (!base || !secret) {
    console.warn(
      "[hr-sync] Skipped: HR_PORTAL_INTERNAL_URL and CANDIDATE_SYNC_SECRET must be set.",
    );
    return;
  }

  const url = `${base.replace(/\/$/, "")}/api/integrations/candidate-apply`;
  const { parsed, resumeUrl, jobId, externalProfileId } = input;

  const body = {
    jobId,
    email: parsed.userInfo.email,
    name: parsed.userInfo.name,
    phone: parsed.userInfo.phone,
    location: parsed.userInfo.location,
    resumeUrl,
    summary: parsed.userInfo.summary,
    skills: parsed.userInfo.skills,
    parsedData: parsed,
    externalProfileId,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HR sync failed (${res.status}): ${text.slice(0, 400)}`);
  }
}
