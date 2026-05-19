"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { isGoogleCalendarConfigured } from "@/lib/google-calendar";
import { normalizeIndianPhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { assertJobAccess, jobWhereOwned, scopeFromUser } from "@/lib/hr-scope";
import { createVapiSchedulingCall, isVapiConfigured } from "@/lib/vapi";

/** Shortlisted = has screening score (same as schedule page pool). */
export async function getShortlistedCallableCandidates(jobId: string) {
  const user = await requireUser();
  await assertJobAccess(jobId, scopeFromUser(user));
  const candidates = await prisma.candidate.findMany({
    where: {
      jobId,
      rankScore: { not: null },
      phone: { not: null },
    },
    orderBy: { rankScore: "desc" },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      rankScore: true,
    },
  });

  return candidates
    .map((c) => ({
      ...c,
      phoneE164: c.phone ? normalizeIndianPhone(c.phone) : null,
    }))
    .filter((c) => c.phoneE164);
}

export async function startAiSchedulingCalls(
  jobId: string,
  candidateIds: string[],
): Promise<{ ok: boolean; message: string; campaignId?: string }> {
  const user = await requireUser();
  const scope = scopeFromUser(user);
  await assertJobAccess(jobId, scope);

  if (!isVapiConfigured()) {
    return {
      ok: false,
      message:
        "Vapi is not configured. Set VAPI_API_KEY, VAPI_PHONE_NUMBER_ID, and VAPI_ASSISTANT_ID (or GEMINI for transient assistant).",
    };
  }

  if (!isGoogleCalendarConfigured()) {
    return {
      ok: false,
      message: "Google Calendar OAuth is not configured (GOOGLE_CLIENT_ID / SECRET).",
    };
  }

  if (!user.googleConnected) {
    return {
      ok: false,
      message: "Connect Google Calendar on your Profile before starting AI calls.",
    };
  }

  if (!candidateIds.length) {
    return { ok: false, message: "Select at least one candidate." };
  }

  const job = await prisma.job.findFirst({
    where: { id: jobId, ...jobWhereOwned(scope) },
  });
  if (!job) return { ok: false, message: "Job not found." };

  const candidates = await prisma.candidate.findMany({
    where: {
      id: { in: candidateIds },
      jobId,
      rankScore: { not: null },
    },
  });

  const callable = candidates.filter((c) => c.phone && normalizeIndianPhone(c.phone));
  if (!callable.length) {
    return {
      ok: false,
      message: "No valid shortlisted candidates with Indian (+91) phone numbers.",
    };
  }

  const campaign = await prisma.schedulingCallCampaign.create({
    data: { jobId, actorId: user.id, status: "active" },
  });

  let started = 0;
  const errors: string[] = [];

  for (const c of callable) {
    const phoneE164 = normalizeIndianPhone(c.phone!)!;
    const callRow = await prisma.schedulingCall.create({
      data: {
        campaignId: campaign.id,
        candidateId: c.id,
        phoneE164,
        status: "queued",
      },
    });

    try {
      const { callId } = await createVapiSchedulingCall({
        customerNumber: phoneE164,
        candidateName: c.name,
        jobTitle: job.title,
        companyName: user.company,
        hrName: user.name,
      });
      await prisma.schedulingCall.update({
        where: { id: callRow.id },
        data: { vapiCallId: callId, status: "ringing" },
      });
      started += 1;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Call failed";
      await prisma.schedulingCall.update({
        where: { id: callRow.id },
        data: { status: "failed", errorMessage: msg },
      });
      errors.push(`${c.name}: ${msg}`);
    }
  }

  await logActivity({
    tag: "interview",
    what: `Started AI scheduling calls for ${started} shortlisted candidate(s) on ${job.title}.`,
    actorId: user.id,
    jobId,
  });

  revalidatePath(`/jobs/${jobId}/schedule`);
  revalidatePath(`/jobs/${jobId}`);

  if (started === 0) {
    return {
      ok: false,
      message: errors.join("; ") || "All calls failed to start.",
      campaignId: campaign.id,
    };
  }

  return {
    ok: true,
    campaignId: campaign.id,
    message:
      errors.length > 0
        ? `Started ${started} call(s). Some failed: ${errors.join("; ")}`
        : `Started ${started} AI scheduling call(s). Results appear when calls complete.`,
  };
}

export async function getSchedulingCampaignStatus(jobId: string) {
  const user = await requireUser();
  await assertJobAccess(jobId, scopeFromUser(user));
  const campaigns = await prisma.schedulingCallCampaign.findMany({
    where: { jobId },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      calls: {
        include: { candidate: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  return campaigns;
}
