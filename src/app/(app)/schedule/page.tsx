import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { Bot, User2, Calendar, ArrowRight, Briefcase } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Schedule · Huptle HR" };

function groupSlotsByDay<T extends { startsAt: Date }>(slots: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const s of slots) {
    const key = s.startsAt.toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
    const arr = map.get(key) ?? [];
    arr.push(s);
    map.set(key, arr);
  }
  return map;
}

export default async function SchedulePage() {
  await requireUser();
  const now = new Date();

  const upcoming = await prisma.interviewSlot.findMany({
    where: { startsAt: { gte: now } },
    orderBy: { startsAt: "asc" },
    include: {
      candidate: { select: { id: true, name: true, email: true } },
      job: { select: { id: true, title: true } },
    },
  });

  const groups = groupSlotsByDay(upcoming);

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-accent uppercase tracking-widest mb-1">Scheduling</div>
          <h1 className="text-3xl font-black text-text-primary tracking-tight">Interview schedule</h1>
          <p className="text-sm text-text-secondary mt-1 font-medium">
            {upcoming.length} upcoming interviews across all jobs.
          </p>
        </div>
        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 rounded-xl bg-surface border border-border px-4 py-2.5 text-sm font-bold text-text-primary hover:border-accent/40 transition-colors"
        >
          <Briefcase size={16} /> Manage from a job
        </Link>
      </div>

      {upcoming.length === 0 ? (
        <div className="py-20 text-center bg-surface border border-dashed border-border rounded-3xl">
          <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-border flex items-center justify-center mx-auto mb-4 text-text-muted opacity-60">
            <Calendar size={32} />
          </div>
          <h3 className="text-base font-bold text-text-primary">No upcoming interviews</h3>
          <p className="text-sm text-text-muted mt-1">Open a job and add an interview slot to get started.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {Array.from(groups.entries()).map(([day, slots]) => (
            <div key={day}>
              <h2 className="text-xs font-black uppercase tracking-widest text-text-muted mb-3">{day}</h2>
              <div className="bg-surface border border-border rounded-2xl overflow-hidden">
                <ul className="divide-y divide-border/30">
                  {slots.map((s) => (
                    <li
                      key={s.id}
                      className="grid grid-cols-[90px_1fr_1.4fr_70px_120px] gap-4 items-center px-6 py-4 hover:bg-surface-2/40 transition-colors"
                    >
                      <div className="text-sm font-bold text-text-primary tabular-nums">
                        {s.startsAt.toLocaleTimeString(undefined, {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-text-primary truncate">
                          {s.candidate?.name ?? <span className="text-text-muted italic">Open slot</span>}
                        </div>
                        {s.candidate?.email && (
                          <div className="text-[11px] text-text-muted font-medium truncate">{s.candidate.email}</div>
                        )}
                      </div>
                      <div className="text-xs text-text-secondary truncate">{s.job.title}</div>
                      <div>
                        <span
                          className={
                            "inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border " +
                            (s.mode === "ai"
                              ? "bg-accent/15 text-accent border-accent/20"
                              : "bg-surface-3 text-text-muted border-border")
                          }
                        >
                          {s.mode === "ai" ? <Bot size={11} /> : <User2 size={11} />}
                          {s.mode === "ai" ? "AI" : "HR"}
                        </span>
                      </div>
                      <div className="flex justify-end">
                        <Link
                          href={`/jobs/${s.job.id}/schedule`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-surface-2 border border-border px-3 py-1.5 text-[11px] font-bold text-text-primary hover:border-accent/40 transition-colors"
                        >
                          Manage <ArrowRight size={11} />
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
