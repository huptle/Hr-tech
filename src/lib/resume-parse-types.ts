/** Normalized resume fields returned by POST /api/resume/parse */

export type ResumeExperienceItem = {
  title: string;
  company: string;
  duration: string;
  highlights: string[];
};

export type ResumeEducationItem = {
  degree: string;
  institution: string;
  year: string;
};

export type ParsedResumeFields = {
  summary: string;
  profile: string;
  skills: string[];
  languages: string[];
  experience: ResumeExperienceItem[];
  education: ResumeEducationItem[];
  certifications: string[];
  keywords: string[];
  /** Best-effort structured contact / headline info */
  contact: {
    name: string;
    email: string;
    phone: string;
    location: string;
    headline: string;
  };
};

export function emptyParsedResume(): ParsedResumeFields {
  return {
    summary: "",
    profile: "",
    skills: [],
    languages: [],
    experience: [],
    education: [],
    certifications: [],
    keywords: [],
    contact: { name: "", email: "", phone: "", location: "", headline: "" },
  };
}
