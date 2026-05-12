import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { Star, Trophy, ArrowRight, Briefcase, Users } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pipeline · Huptle HR" };

export default async function ShortlistPage() {
  await requireUser();

  const jobsWithCandidates = await prisma.job.findMany({
    where: { candidates: { some: {} } },
    orderBy: { updatedAt: "desc" },
    include: {
      candidates: {
        orderBy: [{ rankScore: "desc" }, { createdAt: "desc" }],
      },
    },
  });

  const totalCandidates = jobsWithCandidates.reduce(
    (acc, j) => acc + j.candidates.length,
    0,
  );

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-accent uppercase tracking-widest mb-1">Pipeline</div>
          <h1 className="text-3xl font-black text-text-primary tracking-tight">Candidates pipeline</h1>
          <p className="text-sm text-text-secondary mt-1 font-medium">
            {totalCandidates} candidates across {jobsWithCandidates.length} jobs.
          </p>
        </div>
      </div>

      {jobsWithCandidates.length === 0 ? (
        <div className="py-20 text-center bg-surface border border-dashed border-border rounded-3xl">
          <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-border flex items-center justify-center mx-auto mb-4 text-text-muted opacity-60">
            <Users size={32} />
          </div>
          <h3 className="text-base font-bold text-text-primary">No candidates yet</h3>
          <p className="text-sm text-text-muted mt-1">Add candidates to a job to populate the pipeline.</p>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 mt-6 rounded-xl gradient-bg px-4 py-2 text-xs font-bold text-white"
          >
            <Briefcase size={14} /> Go to jobs
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {jobsWithCandidates.map((job) => (
            <div key={job.id} className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-surface/50">
                <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
                  <Briefcase size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-text-primary truncate">{job.title}</h3>
                  <p className="text-[11px] text-text-muted font-medium">
                    {job.dept || "—"} · {job.location || "—"} · {job.candidates.length} candidate(s)
                  </p>
                </div>
                <Link
                  href={`/jobs/${job.id}/shortlist`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-surface-2 border border-border px-3 py-1.5 text-xs font-bold text-text-primary hover:border-accent/40 transition-colors"
                >
                  <Star size={12} className="text-warning" /> Top shortlist
                  <ArrowRight size={12} />
                </Link>
              </div>

              <ul className="divide-y divide-border/30">
                {job.candidates.map((c, idx) => {
                  const initials = c.name
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((p) => p[0]?.toUpperCase() ?? "")
                    .join("");
                  return (
                    <li
                      key={c.id}
                      className="grid grid-cols-[36px_1.6fr_1fr_120px_120px] gap-4 items-center px-6 py-4 hover:bg-surface-2/40 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-[10px] font-black text-white">
                        {idx === 0 ? <Trophy size={14} /> : initials}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-text-primary truncate">{c.name}</div>
                        <div className="text-[11px] text-text-muted font-medium truncate">
                          {c.email}{c.location ? ` · ${c.location}` : ""}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-surface-3 text-text-muted border-border whitespace-nowrap">
                          {c.journey}
                        </span>
                      </div>
                      <div className="text-xs font-bold tabular-nums text-text-secondary">
                        {c.rankScore != null ? `Score ${Math.round(c.rankScore)}` : "—"}
                      </div>
                      <div className="flex justify-end">
                        <Link
                          href={`/jobs/${job.id}/async-screen/${c.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-surface-2 border border-border px-3 py-1.5 text-[11px] font-bold text-text-primary hover:border-accent/40 transition-colors"
                        >
                          Open
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
