import { supabase } from "@/lib/supabase";
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

export const createProfile = async (profileData: CandidateProfile) => {
  const { data, error } = await supabase
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

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const getProfileByEmail = async (email: string) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", email)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};
