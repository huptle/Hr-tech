import { GoogleGenerativeAI } from "@google/generative-ai";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WorkExperienceEntry {
  company: string;
  role: string;
  location?: string;
  startDate: string;       // e.g. "Jan 2022"
  endDate: string;         // e.g. "Mar 2024" | "Present"
  duration?: string;       // e.g. "2 yrs 3 mos" (computed by Gemini if available)
  employmentType?: string; // e.g. "Full-time" | "Contract" | "Internship"
  responsibilities: string[];  // bullet-level achievements / responsibilities
  technologiesUsed?: string[]; // tech stack mentioned in that role
}

export interface StructuredWorkExperience {
  totalYearsOfExperience?: string;  // e.g. "4+ years"
  entries: WorkExperienceEntry[];
}

// ─── Prompt ───────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `
You are a precise resume parser. Your ONLY job is to extract the Work Experience section from the provided resume text and return it as a strict JSON object.

Rules:
1. Return ONLY valid JSON — no markdown, no code fences, no explanation.
2. Follow the exact schema below.
3. If a field is not present in the resume, use null for strings and [] for arrays.
4. For responsibilities: split into individual bullet points. Each entry should be a clean, complete sentence.
5. For technologiesUsed: pull only the technologies explicitly mentioned in that specific role — do NOT infer.
6. Dates: preserve the format from the resume (e.g., "Jan 2022", "2022", "January 2022"). Use "Present" if the role is current.
7. duration: compute from startDate and endDate if possible (e.g., "1 yr 6 mos"), otherwise null.
8. employmentType: infer from resume text if stated ("Full-time", "Part-time", "Internship", "Contract", "Freelance"), otherwise null.
9. totalYearsOfExperience: compute the total span across all roles (deduplicated / non-overlapping if possible), expressed as "X+ years" or "X years Y months". If you cannot compute it, set null.

JSON Schema:
{
  "totalYearsOfExperience": string | null,
  "entries": [
    {
      "company": string,
      "role": string,
      "location": string | null,
      "startDate": string,
      "endDate": string,
      "duration": string | null,
      "employmentType": string | null,
      "responsibilities": string[],
      "technologiesUsed": string[]
    }
  ]
}
`.trim();

// ─── Service ──────────────────────────────────────────────────────────────────

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!
/**
 * Takes raw resume text (already extracted from PDF) and returns a structured
 * WorkExperience object parsed by Gemini.
 *
 * @param rawResumeText - Plain text extracted from the PDF
 * @returns StructuredWorkExperience
 */
export async function parseWorkExperienceWithAI(
  rawResumeText: string
): Promise<StructuredWorkExperience> {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0,          // deterministic — we want consistent parsing
      responseMimeType: "application/json",
    },
  });

  const prompt = `${SYSTEM_PROMPT}\n\n---RESUME TEXT START---\n${rawResumeText}\n---RESUME TEXT END---`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text().trim();

  // Strip any accidental markdown fences just in case
  const cleaned = responseText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  let parsed: StructuredWorkExperience;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(
      `AI returned invalid JSON for work experience parsing.\nRaw response:\n${responseText}`
    );
  }

  // Validate minimal shape
  if (!parsed || !Array.isArray(parsed.entries)) {
    throw new Error(
      "AI response missing required 'entries' array in work experience schema."
    );
  }

  return parsed;
}