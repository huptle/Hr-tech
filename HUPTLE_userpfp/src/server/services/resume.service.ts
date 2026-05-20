import { supabase } from "@/lib/supabase";
import { ResumeDataSchema, type ResumeData } from "./resume.types";
import { createProfile } from "./profile.service";
import { syncCandidateToHrPortal } from "./hr-sync.service";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";

const MAX_PAGES = 2;

const EXTRACTION_PROMPT = `You are a precise resume parsing agent. Your job is to read the resume text below and extract structured information from it.

Rules:
1. If this document is NOT a resume/CV (e.g., it's an invoice, letter, article, or anything else), set ALL fields to empty strings, nulls, or empty arrays — especially userInfo.name must be empty.
2. Only extract information that is explicitly written in the text — do not invent or infer.
3. For dates, preserve the format used in the resume (e.g., "Jan 2022", "2022", "Present").
4. For responsibilities/achievements, write complete, clean sentences.
5. Extract ALL skills mentioned, both technical and soft skills.
6. If a field is not present, use null for optional strings and [] for arrays.
7. For workExperience, list entries in reverse chronological order (most recent first).
8. For education, list entries in reverse chronological order.

Resume Text:
{resume_text}`;

function safeDecodeText(encoded: string): string {
  return encoded
    .split(/(%[0-9A-Fa-f]{2})/g)
    .map((token) => {
      if (!token.startsWith("%")) return token;
      try {
        return decodeURIComponent(token);
      } catch {
        return " ";
      }
    })
    .join("")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export type ProcessedResumeProfile = {
  resumeUrl: string;
  parsed_data: ResumeData;
  id?: string;
  name?: string;
  email?: string;
};

/** Parse PDF + upload to Supabase; does not sync to HR or require a job id. */
export async function parseAndUploadResume(
  email: string,
  file: File,
): Promise<{ parsedData: ResumeData; resumeUrl: string }> {
  const fileExt = file.name.split(".").pop() || "pdf";
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from("resumes")
    .upload(fileName, arrayBuffer, {
      contentType: file.type || "application/pdf",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(
      `Storage upload failed: ${uploadError.message}. Make sure the 'resumes' bucket exists.`,
    );
  }

  const { data: publicUrlData } = supabase.storage.from("resumes").getPublicUrl(fileName);
  const resumeUrl = publicUrlData.publicUrl;

  let rawText = "";
  let pageCount = 0;
  try {
    const PDFParserModule = await import("pdf2json");
    const PDFParser = PDFParserModule.default || PDFParserModule;
    const pdfParser = new PDFParser(null, true);

    const result = await new Promise<{ text: string; pages: number }>((resolve, reject) => {
      pdfParser.on("pdfParser_dataError", (err: Error | { parserError: Error }) => {
        const msg =
          err instanceof Error ? err.message : err.parserError?.message || "PDF parse error";
        reject(new Error(msg));
      });
      pdfParser.on(
        "pdfParser_dataReady",
        (pdfData: { Pages: { Width: number; Height: number }[] }) => {
          const pages = pdfData.Pages.length;
          const text = pdfParser.getRawTextContent();
          resolve({ text: safeDecodeText(text), pages });
        },
      );
      pdfParser.parseBuffer(buffer);
    });

    rawText = result.text;
    pageCount = result.pages;
  } catch (err) {
    throw new Error(`Failed to parse PDF: ${(err as Error).message}`);
  }

  if (pageCount > MAX_PAGES) {
    throw new Error(
      `Resume exceeds ${MAX_PAGES} pages (found ${pageCount} pages). Please upload a shorter resume.`,
    );
  }

  let parsedData: ResumeData;
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is not set");
    }
    const model = new ChatGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash",
      temperature: 0,
    });

    const prompt = PromptTemplate.fromTemplate(EXTRACTION_PROMPT);
    const chain = prompt.pipe(model.withStructuredOutput(ResumeDataSchema));
    parsedData = await chain.invoke({ resume_text: rawText });
  } catch (err) {
    throw new Error(`AI extraction failed: ${(err as Error).message}`);
  }

  if (!parsedData.userInfo.name) {
    throw new Error(
      "The uploaded document does not appear to be a resume. Please upload a valid resume/CV.",
    );
  }

  const emailMatch = parsedData.userInfo.email || email;
  parsedData.userInfo.email = emailMatch;

  return { parsedData, resumeUrl };
}

export const processAndStoreResume = async (
  email: string,
  file: File,
  jobId: string,
): Promise<ProcessedResumeProfile> => {
  if (!jobId?.trim()) {
    throw new Error("Job id is required. Use the apply link shared by HR.");
  }

  const { parsedData, resumeUrl } = await parseAndUploadResume(email, file);
  const emailMatch = parsedData.userInfo.email;

  const profile = await createProfile({
    name: parsedData.userInfo.name,
    email: emailMatch,
    phone: parsedData.userInfo.phone || "",
    skills: parsedData.userInfo.skills,
    experience: "",
    education: "",
    summary: parsedData.userInfo.summary || "",
    resumeUrl,
    parsedData,
  });

  const row = profile?.[0] as
    | { id?: string; name?: string; email?: string; parsed_data?: ResumeData }
    | undefined;
  await syncCandidateToHrPortal({
    jobId: jobId.trim(),
    parsed: parsedData,
    resumeUrl,
    externalProfileId: row?.id,
  });

  return {
    id: row?.id,
    name: row?.name ?? parsedData.userInfo.name,
    email: row?.email ?? emailMatch,
    parsed_data: (row?.parsed_data as ResumeData | undefined) ?? parsedData,
    resumeUrl,
  };
};
