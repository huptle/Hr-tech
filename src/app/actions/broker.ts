"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { geminiGenerateJson, isGeminiConfigured } from "@/lib/gemini";

// Helper: Ensure the current user has an active Broker profile
async function requireBroker() {
  const user = await requireUser();
  if (user.role.toLowerCase() !== "broker" && !user.isAdmin) {
    throw new Error("Unauthorized: Broker role required.");
  }
  const profile = await prisma.brokerProfile.findUnique({
    where: { userId: user.id },
  });
  if (!profile && !user.isAdmin) {
    throw new Error("Broker profile not found.");
  }
  return { user, profile };
}

export type BrokerDashboardStats = {
  brokerCode: string;
  agencyName: string;
  status: string;
  totalCandidates: number;
  totalJobsPosted: number;
  totalApplications: number;
  interviewsScheduled: number;
  candidatesSelected: number;
  commissionsEarned: number;
  commissionsPending: number;
  commissionsPaid: number;
};

export async function getBrokerDashboardStats(): Promise<BrokerDashboardStats> {
  const { profile } = await requireBroker();
  if (!profile) {
    return {
      brokerCode: "BRK-DEMO",
      agencyName: "Demo Partner",
      status: "approved",
      totalCandidates: 0,
      totalJobsPosted: 0,
      totalApplications: 0,
      interviewsScheduled: 0,
      candidatesSelected: 0,
      commissionsEarned: 0,
      commissionsPending: 0,
      commissionsPaid: 0,
    };
  }

  const [
    totalCandidates,
    totalJobsPosted,
    totalApplications,
    interviewsScheduled,
    candidatesSelected,
    commissions,
  ] = await Promise.all([
    prisma.brokerCandidate.count({ where: { brokerId: profile.id } }),
    prisma.job.count({ where: { brokerPosterId: profile.id } }),
    prisma.candidate.count({ where: { brokerId: profile.id } }),
    prisma.candidate.count({
      where: {
        brokerId: profile.id,
        journey: { in: ["Round 1", "Round 2", "Round 3", "Interview Scheduled"] },
      },
    }),
    prisma.candidate.count({
      where: {
        brokerId: profile.id,
        journey: { in: ["Selected", "Offer Sent", "Offer Accepted", "Joined", "Placement Confirmed"] },
      },
    }),
    prisma.commission.findMany({
      where: { brokerId: profile.id },
      select: { amount: true, status: true },
    }),
  ]);

  let commissionsPaid = 0;
  let commissionsPending = 0;
  let commissionsEarned = 0;

  for (const c of commissions) {
    if (c.status === "Paid") {
      commissionsPaid += c.amount;
      commissionsEarned += c.amount;
    } else if (c.status === "Approved") {
      commissionsEarned += c.amount;
    } else if (c.status === "Pending") {
      commissionsPending += c.amount;
    }
  }

  return {
    brokerCode: profile.brokerCode,
    agencyName: profile.agencyName,
    status: profile.status,
    totalCandidates,
    totalJobsPosted,
    totalApplications,
    interviewsScheduled,
    candidatesSelected,
    commissionsEarned,
    commissionsPending,
    commissionsPaid,
  };
}

export async function getBrokerCandidates() {
  const { profile } = await requireBroker();
  if (!profile) return [];

  return prisma.brokerCandidate.findMany({
    where: { brokerId: profile.id },
    include: {
      applications: {
        include: {
          job: { select: { id: true, title: true, dept: true, location: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function addBrokerCandidate(formData: FormData) {
  const { profile } = await requireBroker();
  if (!profile) throw new Error("Broker profile required.");

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const skills = String(formData.get("skills") ?? "").trim();
  const experienceYears = parseFloat(String(formData.get("experienceYears") ?? "0")) || 0;
  const expectedSalary = String(formData.get("expectedSalary") ?? "").trim();
  const currentCompany = String(formData.get("currentCompany") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const consentGiven = formData.get("consentGiven") === "on" || formData.get("consentGiven") === "true";

  if (!name || !email) {
    throw new Error("Candidate name and email are required.");
  }
  if (!consentGiven) {
    throw new Error("Candidate consent/authorization is required before adding to placement pool.");
  }

  const candidate = await prisma.brokerCandidate.create({
    data: {
      brokerId: profile.id,
      name,
      email,
      phone,
      location,
      skills,
      experienceYears,
      expectedSalary,
      currentCompany,
      notes,
      consentGiven: true,
      consentDate: new Date(),
    },
  });

  revalidatePath("/broker/candidates");
  return candidate;
}

export async function parseResumeWithAI(resumeText: string) {
  if (!resumeText || resumeText.trim().length < 20) {
    throw new Error("Resume content is too short to parse.");
  }

  if (!isGeminiConfigured()) {
    return {
      name: "",
      email: "",
      phone: "",
      location: "",
      skills: [],
      experienceYears: 0,
      summary: resumeText.slice(0, 300),
    };
  }

  const prompt = `Extract candidate details from this resume text into JSON format:
{
  "name": "Full name",
  "email": "Email address",
  "phone": "Phone number with country code if present",
  "location": "City, Country",
  "skills": ["Skill 1", "Skill 2"],
  "experienceYears": 3.5,
  "currentCompany": "Company name",
  "expectedSalary": "",
  "summary": "Short 2-line professional summary"
}

Resume Text:
${resumeText.slice(0, 6000)}`;

  try {
    const parsed = await geminiGenerateJson<any>(prompt);
    return parsed;
  } catch {
    return {
      name: "",
      email: "",
      phone: "",
      location: "",
      skills: [],
      experienceYears: 0,
      summary: resumeText.slice(0, 300),
    };
  }
}

export async function getEligibleJobs(filters?: {
  search?: string;
  location?: string;
  mode?: string;
}) {
  const where: any = {
    status: "Live",
    isBrokerEligible: true,
    approvalStatus: "approved",
  };

  if (filters?.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
      { dept: { contains: filters.search, mode: "insensitive" } },
    ];
  }
  if (filters?.location) {
    where.location = { contains: filters.location, mode: "insensitive" };
  }
  if (filters?.mode && filters.mode !== "all") {
    where.mode = { equals: filters.mode, mode: "insensitive" };
  }

  return prisma.job.findMany({
    where,
    select: {
      id: true,
      title: true,
      description: true,
      dept: true,
      location: true,
      mode: true,
      commissionType: true,
      commissionAmount: true,
      createdAt: true,
      _count: { select: { candidates: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function submitCandidateToJob(input: {
  brokerCandidateId: string;
  jobId: string;
  consentConfirmed: boolean;
}) {
  const { profile } = await requireBroker();
  if (!profile) throw new Error("Broker profile required.");

  if (!input.consentConfirmed) {
    throw new Error("Candidate consent must be confirmed before submitting an application.");
  }

  const brokerCand = await prisma.brokerCandidate.findFirst({
    where: { id: input.brokerCandidateId, brokerId: profile.id },
  });
  if (!brokerCand) {
    throw new Error("Candidate not found in your talent pool.");
  }

  const job = await prisma.job.findFirst({
    where: { id: input.jobId, status: "Live", approvalStatus: "approved" },
  });
  if (!job) {
    throw new Error("Job is not currently open for applications.");
  }

  // Prevent duplicate application for the same candidate and job
  const existing = await prisma.candidate.findUnique({
    where: { jobId_email: { jobId: job.id, email: brokerCand.email.toLowerCase() } },
  });
  if (existing) {
    throw new Error(
      `Duplicate Submission Blocked: ${brokerCand.name} (${brokerCand.email}) has already applied for "${job.title}".`
    );
  }

  // Calculate potential commission
  const commissionAmount = job.commissionAmount || 20000;

  // Create application in Huptle's core Candidate pipeline
  const candidate = await prisma.candidate.create({
    data: {
      jobId: job.id,
      name: brokerCand.name,
      email: brokerCand.email.toLowerCase(),
      phone: brokerCand.phone,
      location: brokerCand.location,
      resumeNotes: `Submitted by Placement Partner: ${profile.agencyName} (${profile.brokerCode})\nSkills: ${brokerCand.skills}\nExp: ${brokerCand.experienceYears} yrs\nCurrent: ${brokerCand.currentCompany}\nNotes: ${brokerCand.notes}`,
      resumeUrl: brokerCand.resumeUrl,
      parsedDataJson: brokerCand.parsedDataJson,
      status: "imported",
      journey: "Applied",
      brokerId: profile.id,
      brokerCandidateId: brokerCand.id,
      source: "broker",
      consentVerified: true,
    },
  });

  // Create pending commission record linked to this placement
  await prisma.commission.create({
    data: {
      brokerId: profile.id,
      candidateId: candidate.id,
      jobId: job.id,
      amount: commissionAmount,
      rate: profile.commissionRate,
      type: job.commissionType,
      status: "Pending",
      notes: `Application initiated on ${new Date().toLocaleDateString()}. Commission pending placement verification.`,
    },
  });

  await logActivity({
    tag: "broker",
    what: `${profile.agencyName} (${profile.brokerCode}) submitted candidate ${brokerCand.name} for ${job.title}.`,
    actorId: profile.userId,
    candidateId: candidate.id,
    jobId: job.id,
  });

  revalidatePath("/broker/applications");
  revalidatePath("/broker/candidates");
  revalidatePath("/broker/commissions");
  return { success: true, candidateId: candidate.id };
}

export async function postBrokerJob(formData: FormData) {
  const { user, profile } = await requireBroker();
  if (!profile) throw new Error("Broker profile required.");

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const dept = String(formData.get("dept") ?? "Engineering").trim();
  const location = String(formData.get("location") ?? "Remote").trim();
  const mode = String(formData.get("mode") ?? "Remote").trim();
  const commissionAmount = parseFloat(String(formData.get("commissionAmount") ?? "20000")) || 20000;

  if (!title) throw new Error("Job title is required.");

  const job = await prisma.job.create({
    data: {
      title,
      description,
      dept,
      location,
      mode,
      status: "Draft",
      approvalStatus: "pending_approval",
      brokerPosterId: profile.id,
      createdById: user.id,
      isBrokerEligible: true,
      commissionType: "fixed",
      commissionAmount,
    },
  });

  await logActivity({
    tag: "broker_job",
    what: `Partner ${profile.agencyName} (${profile.brokerCode}) posted new opening "${title}" (Pending Admin Approval).`,
    actorId: user.id,
    jobId: job.id,
  });

  revalidatePath("/broker/jobs");
  return job;
}

export async function getBrokerApplications() {
  const { profile } = await requireBroker();
  if (!profile) return [];

  return prisma.candidate.findMany({
    where: { brokerId: profile.id },
    include: {
      job: { select: { id: true, title: true, dept: true, location: true } },
      commissions: { select: { id: true, amount: true, status: true, transactionRef: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getBrokerCommissions() {
  const { profile } = await requireBroker();
  if (!profile) return [];

  return prisma.commission.findMany({
    where: { brokerId: profile.id },
    include: {
      candidate: { select: { id: true, name: true, email: true, journey: true } },
      job: { select: { id: true, title: true, dept: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateBrokerPayoutDetails(formData: FormData) {
  const { profile } = await requireBroker();
  if (!profile) throw new Error("Broker profile required.");

  const payoutDetails = String(formData.get("payoutDetails") ?? "").trim();
  const agencyName = String(formData.get("agencyName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  await prisma.brokerProfile.update({
    where: { id: profile.id },
    data: {
      payoutDetails,
      agencyName: agencyName || profile.agencyName,
      phone: phone || profile.phone,
    },
  });

  revalidatePath("/broker/commissions");
  return { success: true };
}
