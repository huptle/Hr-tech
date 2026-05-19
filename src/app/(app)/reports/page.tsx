import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import {
  candidateWhereOwned,
  jobWhereOwned,
  scopeFromUser,
} from "@/lib/hr-scope";
import { HBarChart, LineChart } from "@/components/Charts";
import { BarChart3, Users, Clock, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reports · Huptle HR" };

function daysBetween(a: Date, b: Date): number {
  return Math.max(0, Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));
}

export default async function ReportsPage() {
  const user = await requireUser();
  const scope = scopeFromUser(user);
  const jobFilter = jobWhereOwned(scope);
  const candFilter = candidateWhereOwned(scope);
  const now = new Date();
  const sixWeeksAgo = new Date(now.getTime() - 6 * 7 * 24 * 60 * 60 * 1000);

  const [
    totalCandidates,
    shortlistedCount,
    interviewCount,
    offerCount,
    hiredCount,
    hiredCandidates,
    weeklySource,
    activeJobs,
  ] = await Promise.all([
    prisma.candidate.count({ where: candFilter }),
    prisma.candidate.count({
      where: {
        ...candFilter,
        journey: { in: ["Shortlisted", "Round 1", "Round 2", "Round 3", "Offer Sent", "Offer Accepted"] },
      },
    }),
    prisma.candidate.count({
      where: {
        ...candFilter,
        journey: { in: ["Round 1", "Round 2", "Round 3", "Offer Sent", "Offer Accepted"] },
      },
    }),
    prisma.candidate.count({
      where: { ...candFilter, journey: { in: ["Offer Sent", "Offer Accepted"] } },
    }),
    prisma.candidate.count({ where: { ...candFilter, journey: "Offer Accepted" } }),
    prisma.candidate.findMany({
      where: { ...candFilter, journey: "Offer Accepted" },
      select: { createdAt: true, updatedAt: true },
    }),
    prisma.candidate.findMany({
      where: { ...candFilter, createdAt: { gte: sixWeeksAgo } },
      select: { createdAt: true },
    }),
    prisma.job.count({ where: { ...jobFilter, status: "Live" } }),
  ]);

  const funnel = [
    { label: "Applied", value: totalCandidates, color: "#3f64ba" },
    { label: "Shortlisted", value: shortlistedCount, color: "#4f74ca" },
    { label: "Interview", value: interviewCount, color: "#6f94ea" },
    { label: "Offer", value: offerCount, color: "#7fa4fa" },
    { label: "Hired", value: hiredCount, color: "#10b981" },
  ];

  const avgTimeToHireDays = hiredCandidates.length
    ? Math.round(
        hiredCandidates.reduce((acc, c) => acc + daysBetween(c.createdAt, c.updatedAt), 0) /
          hiredCandidates.length,
      )
    : 0;

  const conversionRate = totalCandidates ? Math.round((hiredCount / totalCandidates) * 1000) / 10 : 0;
  const dropOffRate = totalCandidates
    ? Math.round(((totalCandidates - hiredCount) / totalCandidates) * 100)
    : 0;
  const efficiency = totalCandidates ? Math.round((shortlistedCount / totalCandidates) * 100) : 0;

  const weekBuckets: number[] = Array(6).fill(0);
  for (const c of weeklySource) {
    const weeksAgo = Math.floor(
      (now.getTime() - c.createdAt.getTime()) / (7 * 24 * 60 * 60 * 1000),
    );
    if (weeksAgo >= 0 && weeksAgo < 6) weekBuckets[5 - weeksAgo] += 1;
  }
  const weeklyApplicants = weekBuckets.map((value, i) => ({ label: `W${i + 1}`, value }));

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto flex flex-col gap-8">
      <div>
        <div className="text-xs font-bold text-accent uppercase tracking-widest mb-1">Analytics</div>
        <h1 className="text-3xl font-black text-text-primary tracking-tight">Hiring intelligence</h1>
        <p className="text-sm text-text-secondary mt-1 font-medium">
          Real-time funnel, conversion, and time-to-hire across your workspace.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Conversion rate", value: `${conversionRate}%`, sub: "of applicants hired", icon: TrendingUp },
          { label: "Avg. time to hire", value: hiredCandidates.length ? `${avgTimeToHireDays} days` : "—", sub: "from applied to accepted", icon: Clock },
          { label: "Active jobs", value: String(activeJobs), sub: "currently live", icon: BarChart3 },
          { label: "Candidates", value: String(totalCandidates), sub: "in the system", icon: Users },
        ].map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-3 hover:border-accent/40 transition-colors group">
              <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center group-hover:scale-110 transition-transform">
                <Icon size={18} />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">{m.label}</div>
                <div className="text-3xl font-black text-text-primary tracking-tight">{m.value}</div>
              </div>
              <p className="text-[11px] text-text-muted font-medium">{m.sub}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
        <div className="bg-surface border border-border rounded-3xl p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
              <BarChart3 size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-text-primary tracking-tight">Hiring funnel</h2>
              <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-0.5">All-time</p>
            </div>
          </div>
          <HBarChart data={funnel} maxVal={Math.max(...funnel.map((f) => f.value), 1)} />
          <div className="mt-8 pt-8 border-t border-border grid grid-cols-3 gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase text-text-muted">Total applicants</span>
              <span className="text-xl font-black text-text-primary tracking-tight">{totalCandidates}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase text-text-muted">Drop-off rate</span>
              <span className="text-xl font-black text-red-500 tracking-tight">{dropOffRate}%</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase text-text-muted">Shortlist rate</span>
              <span className="text-xl font-black text-green-500 tracking-tight">{efficiency}%</span>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-3xl p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Users size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-text-primary tracking-tight">Weekly applicants</h2>
              <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-0.5">Last 6 weeks</p>
            </div>
          </div>
          <LineChart data={weeklyApplicants} height={160} color="#3f64ba" />
        </div>
      </div>
    </div>
  );
}
