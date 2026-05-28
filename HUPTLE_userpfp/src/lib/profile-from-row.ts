import type { ResumeData } from "@/server/services/resume.types";

export type CandidateProfileState = {
  name: string;
  email: string;
  phone: string;
  skills: string[];
  experience: string;
  education: string;
  summary?: string;
  resumeUrl?: string;
  parsed_data?: ResumeData;
};

export function profileFromSupabaseRow(
  row: Record<string, unknown>,
  fallbackEmail: string,
): CandidateProfileState {
  const parsed =
    typeof row.parsed_data === "string"
      ? (JSON.parse(row.parsed_data) as ResumeData)
      : (row.parsed_data as ResumeData);

  return {
    name: String(row.name ?? ""),
    email: String(row.email ?? fallbackEmail),
    phone: String(row.phone ?? ""),
    skills: Array.isArray(row.skills) ? (row.skills as string[]) : [],
    experience: String(row.experience ?? ""),
    education: String(row.education ?? ""),
    summary: row.summary ? String(row.summary) : undefined,
    resumeUrl: row.resume_url ? String(row.resume_url) : undefined,
    parsed_data: parsed,
  };
}
