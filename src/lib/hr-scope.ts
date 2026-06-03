import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type HrScope = {
  userId: string;
  isAdmin: boolean;
};

export function scopeFromUser(user: { id: string; isAdmin: boolean }): HrScope {
  return { userId: user.id, isAdmin: user.isAdmin };
}

/** Jobs visible to this HR user (admins see all). */
export function jobWhereOwned(scope: HrScope): Prisma.JobWhereInput {
  if (scope.isAdmin) return {};
  return { createdById: scope.userId };
}

export function candidateWhereOwned(scope: HrScope): Prisma.CandidateWhereInput {
  if (scope.isAdmin) return {};
  return { job: { createdById: scope.userId } };
}

export function slotWhereOwned(scope: HrScope): Prisma.InterviewSlotWhereInput {
  if (scope.isAdmin) return {};
  return { job: { createdById: scope.userId } };
}

export function templateWhereOwned(scope: HrScope): Prisma.TemplateWhereInput {
  if (scope.isAdmin) return {};
  return { authorId: scope.userId };
}

export function activityWhereOwned(scope: HrScope): Prisma.ActivityWhereInput {
  if (scope.isAdmin) return {};
  return { actorId: scope.userId };
}

export async function assertJobAccess(jobId: string, scope: HrScope): Promise<void> {
  const job = await prisma.job.findFirst({
    where: { id: jobId, ...jobWhereOwned(scope) },
    select: { id: true },
  });
  if (!job) {
    throw new Error("Job not found or access denied.");
  }
}

export async function assertTemplateAccess(
  templateId: string,
  scope: HrScope,
): Promise<void> {
  const row = await prisma.template.findFirst({
    where: { id: templateId, ...templateWhereOwned(scope) },
    select: { id: true },
  });
  if (!row) {
    throw new Error("Template not found or access denied.");
  }
}
