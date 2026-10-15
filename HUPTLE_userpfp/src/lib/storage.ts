import fs from "fs/promises";
import path from "path";
import { isSupabaseConfigured, getSupabase } from "@/lib/supabase";

export const RESUMES_DIR =
  process.env.RESUMES_DIR || path.join(process.cwd(), "uploads", "resumes");

/**
 * Save an uploaded resume file to local VPS disk, with optional Supabase fallback.
 * Returns the public URL to access the resume.
 */
export async function saveResume(fileName: string, buffer: Buffer): Promise<string> {
  const useSupabase = process.env.STORAGE_PROVIDER === "supabase" && isSupabaseConfigured();

  if (useSupabase) {
    try {
      const client = getSupabase();
      if (client) {
        const { error } = await client.storage.from("resumes").upload(fileName, buffer, {
          contentType: "application/pdf",
          upsert: false,
        });
        if (!error) {
          const { data } = client.storage.from("resumes").getPublicUrl(fileName);
          return data.publicUrl;
        }
        console.warn("[storage] Supabase upload failed, falling back to local disk:", error.message);
      }
    } catch (e) {
      console.warn("[storage] Supabase exception, falling back to local disk:", e);
    }
  }

  // Default: Store on local VPS disk
  await fs.mkdir(RESUMES_DIR, { recursive: true });
  const filePath = path.join(RESUMES_DIR, fileName);
  await fs.writeFile(filePath, buffer);

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "").replace(/\/$/, "");
  return baseUrl ? `${baseUrl}/api/resumes/${fileName}` : `/api/resumes/${fileName}`;
}
