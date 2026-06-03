import { z } from "zod";

export const WorkExperienceSchema = z.object({
  company: z.string().describe("Company or organization name"),
  role: z.string().describe("Job title or role"),
  location: z.string().nullable().describe("Work location (city, state/region)"),
  startDate: z.string().describe("Start date (e.g. 'Jan 2022' or '2022')"),
  endDate: z.string().describe("End date or 'Present'"),
  duration: z.string().nullable().describe("Duration like '2 yrs 3 mos'"),
  responsibilities: z.array(z.string()).describe("Bullet points of responsibilities and achievements"),
  technologies: z.array(z.string()).describe("Technologies/tools used in this role"),
});

export const EducationSchema = z.object({
  institution: z.string().describe("School or university name"),
  degree: z.string().describe("Degree type (e.g. 'Bachelor of Science', 'B.Tech')"),
  field: z.string().describe("Field of study or major"),
  startDate: z.string().nullable().describe("Start year/date"),
  endDate: z.string().describe("Graduation year/date"),
  gpa: z.string().nullable().describe("GPA if mentioned"),
});

export const ProjectSchema = z.object({
  name: z.string().describe("Project name"),
  description: z.string().describe("Short description of the project"),
  technologies: z.array(z.string()).describe("Technologies used in the project"),
  url: z.string().nullable().describe("Project URL if available"),
});

export const CertificationSchema = z.object({
  name: z.string().describe("Certification name"),
  issuer: z.string().nullable().describe("Issuing organization"),
  year: z.string().nullable().describe("Year obtained"),
});

export const MiscellaneousSchema = z.object({
  languages: z.array(z.object({
    language: z.string(),
    proficiency: z.string(),
  })).describe("Languages the candidate speaks"),
  interests: z.array(z.string()).describe("Hobbies or interests mentioned"),
  publications: z.array(z.string()).describe("Publications if any"),
  patents: z.array(z.string()).describe("Patents if any"),
  volunteerWork: z.array(z.string()).describe("Volunteer experience"),
  other: z.string().nullable().describe("Any other relevant information not covered above"),
});

export const ResumeDataSchema = z.object({
  userInfo: z.object({
    name: z.string().describe("Full name of the candidate"),
    email: z.string().describe("Email address"),
    phone: z.string().nullable().describe("Phone number"),
    location: z.string().nullable().describe("City, State/Country"),
    linkedin: z.string().nullable().describe("LinkedIn profile URL"),
    github: z.string().nullable().describe("GitHub profile URL"),
    portfolio: z.string().nullable().describe("Personal website or portfolio URL"),
    summary: z.string().nullable().describe("Professional summary or objective"),
    skills: z.array(z.string()).describe("All technical and soft skills mentioned"),
  }),
  workExperience: z.array(WorkExperienceSchema),
  education: z.array(EducationSchema),
  projects: z.array(ProjectSchema),
  certifications: z.array(CertificationSchema),
  miscellaneous: MiscellaneousSchema,
});

export type ResumeData = z.infer<typeof ResumeDataSchema>;
export type WorkExperience = z.infer<typeof WorkExperienceSchema>;
export type Education = z.infer<typeof EducationSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type Certification = z.infer<typeof CertificationSchema>;
export type Miscellaneous = z.infer<typeof MiscellaneousSchema>;

export const ResumeValidationSchema = z.object({
  isResume: z.boolean().describe("Whether the document is a resume/CV"),
  reason: z.string().nullable().describe("If not a resume, explain why in one sentence"),
  pageCount: z.number().describe("Estimated number of pages"),
});

export type ResumeValidation = z.infer<typeof ResumeValidationSchema>;
