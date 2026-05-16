import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { geminiGenerateJson, isGeminiConfigured } from "@/lib/gemini";
import {
  emptyParsedResume,
  type ParsedResumeFields,
} from "@/lib/resume-parse-types";

export const runtime = "nodejs";
export const maxDuration = 60;

const JSON_INSTRUCTION = `Return JSON with this exact shape (use empty string or [] where unknown):
{
  "summary": "2-5 sentence professional summary for recruiters",
  "profile": "one-line headline / objective",
  "skills": ["deduplicated skill phrases, Title Case or as commonly written"],
  "languages": ["spoken languages if inferable, else []"],
  "experience": [{ "title": "", "company": "", "duration": "", "highlights": ["bullet strings"] }],
  "education": [{ "degree": "", "institution": "", "year": "" }],
  "certifications": ["short strings"],
  "keywords": ["8-20 ATS-style keywords from the resume"],
  "contact": { "name": "", "email": "", "phone": "", "location": "", "headline": "" }
}`;

function normalizeBody(raw: unknown): string {
  if (raw === null || raw === undefined) return "";
  if (typeof raw === "string") return raw.trim();
  return JSON.stringify(raw, null, 2);
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function asStringArray(x: unknown): string[] {
  if (!Array.isArray(x)) return [];
  return x
    .filter((i): i is string => typeof i === "string" && i.trim().length > 0)
    .map((s) => s.trim());
}

function parseGeminiResumePayload(raw: unknown): ParsedResumeFields {
  const base = emptyParsedResume();
  if (!isRecord(raw)) return base;

  base.summary = typeof raw.summary === "string" ? raw.summary.trim() : "";
  base.profile = typeof raw.profile === "string" ? raw.profile.trim() : "";
  base.skills = asStringArray(raw.skills);
  base.languages = asStringArray(raw.languages);
  base.certifications = asStringArray(raw.certifications);
  base.keywords = asStringArray(raw.keywords);

  if (Array.isArray(raw.experience)) {
    for (const row of raw.experience) {
      if (!isRecord(row)) continue;
      base.experience.push({
        title: typeof row.title === "string" ? row.title.trim() : "",
        company: typeof row.company === "string" ? row.company.trim() : "",
        duration: typeof row.duration === "string" ? row.duration.trim() : "",
        highlights: asStringArray(row.highlights),
      });
    }
  }

  if (Array.isArray(raw.education)) {
    for (const row of raw.education) {
      if (!isRecord(row)) continue;
      base.education.push({
        degree: typeof row.degree === "string" ? row.degree.trim() : "",
        institution:
          typeof row.institution === "string" ? row.institution.trim() : "",
        year: typeof row.year === "string" ? row.year.trim() : "",
      });
    }
  }

  if (isRecord(raw.contact)) {
    base.contact = {
      name: typeof raw.contact.name === "string" ? raw.contact.name.trim() : "",
      email:
        typeof raw.contact.email === "string" ? raw.contact.email.trim() : "",
      phone:
        typeof raw.contact.phone === "string" ? raw.contact.phone.trim() : "",
      location:
        typeof raw.contact.location === "string"
          ? raw.contact.location.trim()
          : "",
      headline:
        typeof raw.contact.headline === "string"
          ? raw.contact.headline.trim()
          : "",
    };
  }

  return base;
}

async function authorize(req: NextRequest): Promise<boolean> {
  const expected = process.env.RESUME_PARSER_API_KEY?.trim();
  if (expected) {
    const bearer = req.headers.get("authorization")?.trim();
    if (bearer === `Bearer ${expected}`) return true;
    const headerKey = req.headers.get("x-api-key")?.trim();
    if (headerKey === expected) return true;
    return false;
  }
  const user = await getCurrentUser();
  return user !== null;
}

/**
 * POST /api/resume/parse
 *
 * Body: JSON — either `{ "rawText": "..." }` or any object (full resume JSON / partial).
 * Auth: set RESUME_PARSER_API_KEY and send `Authorization: Bearer <key>` or `X-Api-Key: <key>`.
 *       If unset, requires signed-in HR session (cookie).
 *
 * Requires GEMINI_API_KEY for extraction (uses Gemini JSON mode).
 */
export async function GET() {
  return NextResponse.json({
    endpoint: "/api/resume/parse",
    method: "POST",
    contentType: "application/json",
    auth: process.env.RESUME_PARSER_API_KEY?.trim()
      ? "Authorization: Bearer <RESUME_PARSER_API_KEY> or X-Api-Key: <same>"
      : "Signed-in HR session (hr_session cookie), or set RESUME_PARSER_API_KEY for API-key access",
    bodyExamples: {
      rawText: "Paste full resume text here…",
      structured: {
        name: "Jane Doe",
        experience: [{ company: "Acme", title: "Engineer", years: "2020–2024" }],
      },
    },
    responseShape: {
      ok: true,
      fields: {
        summary: "string",
        profile: "string",
        skills: ["string"],
        languages: ["string"],
        experience: [
          { title: "", company: "", duration: "", highlights: [""] },
        ],
        education: [{ degree: "", institution: "", year: "" }],
        certifications: ["string"],
        keywords: ["string"],
        contact: {
          name: "",
          email: "",
          phone: "",
          location: "",
          headline: "",
        },
      },
    },
    requiresGemini: Boolean(process.env.GEMINI_API_KEY?.trim()),
  });
}

export async function POST(req: NextRequest) {
  if (!(await authorize(req))) {
    return NextResponse.json(
      {
        error: "Unauthorized",
        hint:
          process.env.RESUME_PARSER_API_KEY?.trim()
            ? "Send Authorization: Bearer <RESUME_PARSER_API_KEY> or X-Api-Key header."
            : "Sign in to the HR app, or set RESUME_PARSER_API_KEY in server env for machine access.",
      },
      { status: 401 },
    );
  }

  if (!isGeminiConfigured()) {
    return NextResponse.json(
      {
        error: "Gemini is not configured",
        hint: "Set GEMINI_API_KEY on the server to enable resume parsing.",
      },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const textBlock = normalizeBody(body);
  if (!textBlock) {
    return NextResponse.json(
      {
        error: "Empty resume payload",
        hint: 'Send JSON with at least "rawText" string or a full resume object.',
      },
      { status: 400 },
    );
  }

  const prompt = `You are an expert resume parser for HR software. Extract structured fields from the candidate data below.
The input may be free-form text, a JSON resume export, or a mix. Infer missing sections conservatively; do not invent employers or degrees not supported by the text.

INPUT:
${textBlock.slice(0, 48_000)}

${JSON_INSTRUCTION}`;

  try {
    const parsed = await geminiGenerateJson<unknown>(prompt);
    const fields = parseGeminiResumePayload(parsed);
    return NextResponse.json({ ok: true, fields });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Parse failed";
    return NextResponse.json(
      { error: "Resume parsing failed", detail: message },
      { status: 502 },
    );
  }
}
