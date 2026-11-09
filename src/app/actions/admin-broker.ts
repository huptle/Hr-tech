"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

async function requireAdmin() {
  const user = await requireUser();
  if (!user.isAdmin) {
    throw new Error("Unauthorized: Admin access required.");
  }
  return user;
}

export async function getAdminBrokerList() {
  await requireAdmin();
  return prisma.brokerProfile.findMany({
    include: {
      user: { select: { id: true, name: true, email: true, createdAt: true } },
      _count: {
        select: {
          candidates: true,
          applications: true,
          commissions: true,
          jobsPosted: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateBrokerStatus(brokerId: string, status: "approved" | "rejected" | "pending") {
  const admin = await requireAdmin();

  const broker = await prisma.brokerProfile.update({
    where: { id: brokerId },
    data: { status },
    include: { user: { select: { name: true, email: true } } },
  });

  await logActivity({
    tag: "new",
    what: `Admin ${admin.name} updated Broker ${broker.agencyName} (${broker.brokerCode}) status to "${status}".`,
    actorId: admin.id,
  });

  revalidatePath("/admin/brokers");
  revalidatePath("/broker");
  return broker;
}

export async function getAdminBrokerJobs() {
  await requireAdmin();
  return prisma.job.findMany({
    where: { brokerPosterId: { not: null } },
    include: {
      brokerPoster: { select: { id: true, agencyName: true, brokerCode: true } },
      createdBy: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateJobApproval(jobId: string, approvalStatus: "approved" | "rejected") {
  const admin = await requireAdmin();

  const job = await prisma.job.update({
    where: { id: jobId },
    data: {
      approvalStatus,
      status: approvalStatus === "approved" ? "Live" : "Draft",
    },
  });

  await logActivity({
    tag: "job",
    what: `Admin ${admin.name} ${approvalStatus === "approved" ? "approved" : "rejected"} partner job "${job.title}".`,
    actorId: admin.id,
    jobId: job.id,
  });

  revalidatePath("/admin/brokers");
  revalidatePath("/jobs");
  revalidatePath("/broker/jobs");
  return job;
}

export async function getAdminCommissions() {
  await requireAdmin();
  return prisma.commission.findMany({
    include: {
      broker: { select: { id: true, agencyName: true, brokerCode: true, payoutDetails: true, phone: true } },
      candidate: { select: { id: true, name: true, email: true, journey: true, phone: true } },
      job: { select: { id: true, title: true, dept: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function approveCommission(commissionId: string, joiningDate?: string) {
  const admin = await requireAdmin();

  const commission = await prisma.commission.update({
    where: { id: commissionId },
    data: {
      status: "Approved",
      verifiedAt: new Date(),
      verifiedById: admin.id,
      joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
      notes: `Verified & approved by Admin ${admin.name} on ${new Date().toLocaleDateString()}.`,
    },
    include: {
      broker: { select: { agencyName: true, brokerCode: true } },
      candidate: { select: { name: true } },
    },
  });

  await logActivity({
    tag: "hired",
    what: `Admin ${admin.name} approved placement commission ₹${commission.amount} for ${commission.broker.agencyName} (${commission.candidate.name}).`,
    actorId: admin.id,
  });

  revalidatePath("/admin/brokers");
  revalidatePath("/broker/commissions");
  return commission;
}

export async function markCommissionPaid(commissionId: string, transactionRef: string) {
  const admin = await requireAdmin();
  if (!transactionRef.trim()) {
    throw new Error("Transaction reference ID / payment proof is required.");
  }

  const commission = await prisma.commission.update({
    where: { id: commissionId },
    data: {
      status: "Paid",
      paidAt: new Date(),
      transactionRef: transactionRef.trim(),
      notes: `Payout completed via Ref: ${transactionRef.trim()} on ${new Date().toLocaleDateString()}.`,
    },
    include: {
      broker: { select: { agencyName: true, brokerCode: true } },
      candidate: { select: { name: true } },
    },
  });

  await logActivity({
    tag: "hired",
    what: `Admin ${admin.name} recorded payout ₹${commission.amount} (Ref: ${transactionRef}) to ${commission.broker.agencyName}.`,
    actorId: admin.id,
  });

  revalidatePath("/admin/brokers");
  revalidatePath("/broker/commissions");
  return commission;
}

export async function reverseCommission(commissionId: string, reason: string) {
  const admin = await requireAdmin();

  const commission = await prisma.commission.update({
    where: { id: commissionId },
    data: {
      status: "Reversed",
      notes: `Reversed by Admin ${admin.name}: ${reason || "Candidate did not complete verification period."}`,
    },
    include: {
      broker: { select: { agencyName: true } },
      candidate: { select: { name: true } },
    },
  });

  await logActivity({
    tag: "rejected",
    what: `Admin ${admin.name} reversed commission for ${commission.candidate.name} (${commission.broker.agencyName}): ${reason}.`,
    actorId: admin.id,
  });

  revalidatePath("/admin/brokers");
  revalidatePath("/broker/commissions");
  return commission;
}

export async function updateJobCommissionConfig(jobId: string, commissionType: string, commissionAmount: number) {
  await requireAdmin();

  const job = await prisma.job.update({
    where: { id: jobId },
    data: {
      commissionType: commissionType === "percentage" ? "percentage" : "fixed",
      commissionAmount: Math.max(0, commissionAmount),
    },
  });

  revalidatePath("/admin/brokers");
  revalidatePath("/jobs");
  revalidatePath("/broker/jobs");
  return job;
}

export type AdminBrokerItem = Awaited<ReturnType<typeof getAdminBrokerList>>[number];
export type AdminBrokerJobItem = Awaited<ReturnType<typeof getAdminBrokerJobs>>[number];
export type AdminCommissionItem = Awaited<ReturnType<typeof getAdminCommissions>>[number];

