import fs from "fs/promises";
import path from "path";
import { isSupabaseConfigured, getSupabase } from "@/lib/supabase";
import type { ResumeData } from "./resume.types";

export interface CandidateProfile {
  name: string;
  email: string;
  phone: string;
  skills: string[];
  experience: string;
  education: string;
  summary?: string;
  resumeUrl?: string;
  parsedData?: ResumeData;
}

const PROFILES_DIR =
  process.env.DATA_DIR || path.join(process.cwd(), "data", "profiles");

function getProfilePath(email: string): string {
  const safeName = encodeURIComponent(email.trim().toLowerCase()) + ".json";
  return path.join(PROFILES_DIR, safeName);
}

export const createProfile = async (profileData: CandidateProfile) => {
  const email = profileData.email.trim().toLowerCase();
  const id = `profile_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  const localRecord = {
    id,
    name: profileData.name,
    email: profileData.email,
    phone: profileData.phone,
    skills: profileData.skills,
    experience: profileData.experience,
    education: profileData.education,
    summary: profileData.summary,
    resume_url: profileData.resumeUrl,
    parsed_data: profileData.parsedData ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // 1. Save locally on VPS disk
  try {
    await fs.mkdir(PROFILES_DIR, { recursive: true });
    await fs.writeFile(getProfilePath(email), JSON.stringify(localRecord, null, 2), "utf-8");
  } catch (err) {
    console.warn("[profile.service] Failed to write profile to local disk:", err);
  }

  // 2. Optional: mirror to Supabase if configured & reachable
  if (isSupabaseConfigured()) {
    try {
      const client = getSupabase();
      if (client) {
        const { data, error } = await client
          .from("profiles")
          .insert([
            {
              name: profileData.name,
              email: profileData.email,
              phone: profileData.phone,
              skills: profileData.skills,
              experience: profileData.experience,
              education: profileData.education,
              summary: profileData.summary,
              resume_url: profileData.resumeUrl,
              parsed_data: profileData.parsedData ?? null,
            },
          ])
          .select();

        if (!error && data && data.length > 0) {
          return data;
        }
      }
    } catch (e) {
      console.warn("[profile.service] Supabase profile sync skipped:", e);
    }
  }

  return [localRecord];
};

export const getProfileByEmail = async (email: string) => {
  const normalized = email.trim().toLowerCase();

  // 1. Try local VPS disk first
  try {
    const raw = await fs.readFile(getProfilePath(normalized), "utf-8");
    return JSON.parse(raw);
  } catch {
    // If not found locally, proceed to fallback
  }

  // 2. Fallback to Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      const client = getSupabase();
      if (client) {
        const { data, error } = await client
          .from("profiles")
          .select("*")
          .eq("email", normalized)
          .single();

        if (!error && data) {
          return data;
        }
      }
    } catch {
      // Ignored
    }
  }

  throw new Error(`Profile not found for ${email}`);
};
