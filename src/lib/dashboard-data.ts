import "server-only";

import { prisma } from "@/lib/prisma";
import { timeAgo } from "@/lib/activity";
import type {
  DashboardJob,
  DashboardUpcoming,
  DashboardActivity,
  DashboardStats,
  DashboardFunnel,
  DashboardWeekly,
} from "@/components/screens/Dashboard";

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function progressForJourney(journey: string): number {
  const order = [
    "Applied",
    "Resume Received",
    "Shortlisted",
    "Round 1",
    "Round 2",
    "Round 3",
    "Offer Sent",
    "Offer Accepted",
  ];
  const idx = order.indexOf(journey);
  if (idx < 0) return 0;
  return Math.round(((idx + 1) / order.length) * 100);
}

function formatWhen(d: Date): string {
  const now = new Date();
  const sameDay = startOfDay(d).getTime() === startOfDay(now).getTime();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = startOfDay(d).getTime() === startOfDay(tomorrow).getTime();
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  if (sameDay) return `Today · ${time}`;
  if (isTomorrow) return `Tomorrow · ${time}`;
  return d.toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" });
}

export async function getDashboardData(): Promise<{
  jobs: DashboardJob[];
  totalJobsCount: number;
  upcoming: DashboardUpcoming[];
  activity: DashboardActivity[];
  stats: DashboardStats;
  funnel: DashboardFunnel;
  weekly: DashboardWeekly;
}> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const eightWeeksAgo = new Date(now.getTime() - 8 * 7 * 24 * 60 * 60 * 1000);

  const [
    totalJobsCount,
    activeJobsCount,
    draftJobsCount,
    jobsTopRaw,
    totalCandidates,
    newCandidates7d,
    totalInterviews,
    aiInterviews,
    remainingToday,
    offersAccepted,
    newOffers30d,
    upcomingRaw,
    activityRaw,
    funnelCounts,
    weeklyApplicants,
  ] = await Promise.all([
    prisma.job.count(),
    prisma.job.count({ where: { status: "Live" } }),
    prisma.job.count({ where: { status: "Draft" } }),
    prisma.job.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        _count: { select: { candidates: true } },
        candidates: { select: { journey: true } },
      },
    }),
    prisma.candidate.count(),
    prisma.candidate.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.interviewSlot.count(),
    prisma.interviewSlot.count({ where: { mode: "ai" } }),
    prisma.interviewSlot.count({
      where: { startsAt: { gte: now, lte: endOfDay(now) } },
    }),
    prisma.candidate.count({ where: { journey: "Offer Accepted" } }),
    prisma.candidate.count({
      where: { journey: "Offer Accepted", updatedAt: { gte: thirtyDaysAgo } },
    }),
    prisma.interviewSlot.findMany({
      where: { startsAt: { gte: now }, candidateId: { not: null } },
      orderBy: { startsAt: "asc" },
      take: 4,
      include: {
        candidate: { select: { name: true } },
        job: { select: { title: true } },
      },
    }),
    prisma.activity.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { actor: { select: { name: true } } },
    }),
    Promise.all([
      prisma.candidate.count(),
      prisma.candidate.count({ where: { journey: { in: ["Shortlisted", "Round 1", "Round 2", "Round 3", "Offer Sent", "Offer Accepted"] } } }),
      prisma.candidate.count({ where: { journey: { in: ["Round 1", "Round 2", "Round 3", "Offer Sent", "Offer Accepted"] } } }),
      prisma.candidate.count({ where: { journey: { in: ["Offer Sent", "Offer Accepted"] } } }),
      prisma.candidate.count({ where: { journey: "Offer Accepted" } }),
    ]),
    prisma.candidate.findMany({
      where: { createdAt: { gte: eightWeeksAgo } },
      select: { createdAt: true },
    }),
  ]);

  const jobs: DashboardJob[] = jobsTopRaw.map((j) => {
    const total = j.candidates.length || 1;
    const avgProgress =
      j.candidates.length === 0
        ? 0
        : Math.round(
            j.candidates.reduce((acc, c) => acc + progressForJourney(c.journey), 0) / total,
          );
    return {
      id: j.id,
      title: j.title,
      dept: j.dept,
      location: j.location,
      applicants: j._count.candidates,
      status: j.status,
      progress: avgProgress,
    };
  });

  const upcoming: DashboardUpcoming[] = upcomingRaw.map((s) => ({
    id: s.id,
    candidateName: s.candidate?.name ?? "Unassigned",
    jobTitle: s.job.title,
    when: formatWhen(s.startsAt),
    mode: s.mode === "ai" ? "AI" : "HR",
  }));

  const activity: DashboardActivity[] = activityRaw.map((a) => {
    const tag = (["new", "hired", "rejected", "interview", "job", "template"] as const).includes(
      a.tag as never,
    )
      ? (a.tag as DashboardActivity["tag"])
      : "new";
    return {
      who: a.actor?.name ?? "System",
      what: a.what,
      tag,
      when: timeAgo(a.createdAt),
    };
  });

  const [fApplied, fShortlisted, fInterview, fOffer, fHired] = funnelCounts;
  const funnel: DashboardFunnel = [
    { label: "Applied", value: fApplied },
    { label: "Shortlisted", value: fShortlisted },
    { label: "Interview", value: fInterview },
    { label: "Offer", value: fOffer },
    { label: "Hired", value: fHired },
  ];

  const weekBuckets: number[] = Array(8).fill(0);
  for (const c of weeklyApplicants) {
    const weeksAgo = Math.floor(
      (now.getTime() - c.createdAt.getTime()) / (7 * 24 * 60 * 60 * 1000),
    );
    if (weeksAgo >= 0 && weeksAgo < 8) {
      weekBuckets[7 - weeksAgo] += 1;
    }
  }
  const weekly: DashboardWeekly = weekBuckets.map((value, i) => ({
    label: `W${i + 1}`,
    value,
  }));

  const stats: DashboardStats = {
    totalJobs: totalJobsCount,
    draftJobs: draftJobsCount,
    activeJobs: activeJobsCount,
    totalCandidates,
    newCandidates7d,
    totalInterviews,
    aiInterviews,
    remainingToday,
    offersAccepted,
    newOffers30d,
  };

  return {
    jobs,
    totalJobsCount,
    upcoming,
    activity,
    stats,
    funnel,
    weekly,
  };
}
