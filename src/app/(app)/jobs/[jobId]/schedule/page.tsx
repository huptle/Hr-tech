import {
  assignSlotToCandidate,
  createInterviewSlot,
  deleteInterviewSlot,
} from "@/app/actions/slots";
import { getSchedulingCampaignStatus } from "@/app/actions/scheduling-calls";
import { ScheduleSlotEmailDrafts } from "@/components/ai/schedule-email-drafts";
import { AiSchedulingPanel } from "@/components/scheduling/ai-scheduling-panel";
import { isGeminiConfigured } from "@/lib/gemini";
import { isGoogleCalendarConfigured } from "@/lib/google-calendar";
import { normalizeIndianPhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { isVapiConfigured } from "@/lib/vapi";
import { requireUser } from "@/lib/auth";
import { jobWhereOwned, scopeFromUser } from "@/lib/hr-scope";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Section } from "@/components/motion-wrappers";
import { Badge } from "@/components/ui/badge";
import {
  Calendar, ArrowLeft, Plus, Star, Trash2,
  Bot, User2, AlertTriangle, Clock
} from "lucide-react";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ jobId: string }> };

export default async function SchedulePage({ params }: PageProps) {
  const { jobId } = await params;
  const user = await requireUser();
  const scope = scopeFromUser(user);
  const job = await prisma.job.findFirst({
    where: { id: jobId, ...jobWhereOwned(scope) },
    include: {
      slots: {
        orderBy: { startsAt: "asc" },
        include: { candidate: true },
      },
      candidates: {
        where: { rankScore: { not: null } },
        orderBy: { rankScore: "desc" },
      },
    },
  });

  if (!job) notFound();

  const geminiReady = isGeminiConfigured();
  const vapiReady = isVapiConfigured();
  const googleConnected = user.googleConnected;

  const callableCandidates = job.candidates
    .filter((c) => c.phone && normalizeIndianPhone(c.phone))
    .map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      phoneE164: normalizeIndianPhone(c.phone!),
      rankScore: c.rankScore,
    }));

  const recentCampaigns = await getSchedulingCampaignStatus(jobId);

  return (
    <div className="relative min-h-full">
      <div className="mesh-bg" aria-hidden />
      <div className="relative z-10">

        <PageHeader className="border-b border-white/6 bg-background/60 backdrop-blur-sm">
          <div className="mx-auto max-w-5xl px-6 py-8">
            <Link
              href={`/jobs/${job.id}`}
              className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-secondary transition-colors mb-4"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {job.title}
            </Link>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <Badge variant="accent" className="mb-2">
                  <Calendar className="h-3 w-3" />
                  Scheduling
                </Badge>
                <h1 className="text-3xl font-bold tracking-tight text-text-primary">
                  Interview schedule
                </h1>
                <p className="mt-1.5 text-sm text-text-secondary">
                  Offer HR or AI interviews; assign candidates.
                  {geminiReady
                    ? " Gemini can draft emails below; wire Resend/SendGrid to send."
                    : " Add GEMINI_API_KEY for AI-drafted invite/reject/offer emails."}
                </p>
              </div>
              <Link
                href={`/jobs/${job.id}/shortlist`}
                className="inline-flex items-center gap-2 rounded-xl glass border border-white/10 px-4 py-2 text-sm font-medium text-text-primary transition-all duration-200 hover:bg-white/8 hover:border-white/20"
              >
                <Star className="h-4 w-4 text-warning" />
                Shortlist
              </Link>
            </div>
          </div>
        </PageHeader>

        <main className="mx-auto max-w-5xl space-y-6 px-6 py-10">

          <Section delay={0.02}>
            <AiSchedulingPanel
              jobId={job.id}
              candidates={callableCandidates}
              vapiReady={vapiReady}
              googleConnected={googleConnected && isGoogleCalendarConfigured()}
            />
          </Section>

          {recentCampaigns.length > 0 && (
            <Section delay={0.04}>
              <div className="rounded-2xl border border-white/8 bg-surface/80 p-6">
                <h2 className="text-sm font-semibold text-text-primary mb-4">Recent AI call campaigns</h2>
                <ul className="space-y-3 text-xs">
                  {recentCampaigns.map((camp) => (
                    <li key={camp.id} className="border-b border-white/5 pb-3 last:border-0">
                      <p className="text-text-muted mb-2">
                        {camp.createdAt.toLocaleString()} · {camp.calls.length} call(s)
                      </p>
                      {camp.calls.map((call) => (
                        <div key={call.id} className="flex justify-between gap-2 py-1">
                          <span className="text-text-primary">{call.candidate.name}</span>
                          <span className="text-text-muted capitalize">{call.status}</span>
                        </div>
                      ))}
                    </li>
                  ))}
                </ul>
              </div>
            </Section>
          )}

          {/* Proctoring alert */}
          <Section delay={0.06}>
            <div className="flex items-start gap-3 rounded-2xl border border-warning/20 bg-warning/8 px-5 py-4 text-sm text-warning">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                <strong className="font-semibold">Proctoring / AI interviews: </strong>
                For &quot;AI&quot; mode slots, plan a cheating check (browser lock, ID step, or
                third-party proctor) before going live.
              </span>
            </div>
          </Section>

          {/* Add slot form */}
          <Section delay={0.08}>
            <div className="rounded-2xl border border-white/8 bg-surface/80 backdrop-blur-sm shadow-xl shadow-black/20">
              <div className="flex items-center gap-3 border-b border-white/6 px-6 py-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15">
                  <Plus className="h-4 w-4 text-accent" />
                </div>
                <h2 className="text-sm font-semibold text-text-primary">Add slot</h2>
              </div>
              <form
                action={createInterviewSlot.bind(null, job.id)}
                className="p-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end"
              >
                <div>
                  <label
                    htmlFor="startsAt"
                    className="block text-xs font-medium uppercase tracking-wider text-text-muted mb-1.5"
                  >
                    Start
                  </label>
                  <input
                    id="startsAt"
                    name="startsAt"
                    type="datetime-local"
                    required
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-text-primary transition-all duration-200 hover:border-white/20 focus:outline-none focus:border-accent/60 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="durationMin"
                    className="block text-xs font-medium uppercase tracking-wider text-text-muted mb-1.5"
                  >
                    Duration
                  </label>
                  <select
                    id="durationMin"
                    name="durationMin"
                    defaultValue="30"
                    className="rounded-xl border border-white/10 bg-surface-2 px-3 py-2.5 text-sm text-text-primary transition-all duration-200 hover:border-white/20 focus:outline-none focus:border-accent/60 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]"
                  >
                    <option value="30">30 min</option>
                    <option value="45">45 min</option>
                    <option value="60">60 min</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="mode"
                    className="block text-xs font-medium uppercase tracking-wider text-text-muted mb-1.5"
                  >
                    Interview type
                  </label>
                  <select
                    id="mode"
                    name="mode"
                    className="rounded-xl border border-white/10 bg-surface-2 px-3 py-2.5 text-sm text-text-primary transition-all duration-200 hover:border-white/20 focus:outline-none focus:border-accent/60 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]"
                  >
                    <option value="hr">HR (human)</option>
                    <option value="ai">AI (recorded / live agent)</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl gradient-bg px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Plus className="h-4 w-4" />
                  Add slot
                </button>
              </form>
            </div>
          </Section>

          {/* Slots list */}
          <Section delay={0.15}>
            <div className="rounded-2xl border border-white/8 bg-surface/80 backdrop-blur-sm shadow-xl shadow-black/20">
              <div className="flex items-center gap-3 border-b border-white/6 px-6 py-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/15">
                  <Calendar className="h-4 w-4 text-sky-400" />
                </div>
                <h2 className="text-sm font-semibold text-text-primary">Slots</h2>
                {job.slots.length > 0 && (
                  <Badge variant="default" className="ml-auto">{job.slots.length}</Badge>
                )}
              </div>

              {job.slots.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
                    <Clock className="h-5 w-5 text-text-muted" />
                  </div>
                  <p className="text-sm text-text-muted">No slots yet. Add one above.</p>
                </div>
              ) : (
                <ul className="divide-y divide-white/5 p-4">
                  {job.slots.map((slot) => (
                    <li key={slot.id} className="rounded-xl p-4 space-y-4 hover:bg-white/2 transition-colors">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Badge variant={slot.mode === "ai" ? "ai" : "hr"}>
                            {slot.mode === "ai" ? (
                              <>
                                <Bot className="h-3 w-3" /> AI
                              </>
                            ) : (
                              <>
                                <User2 className="h-3 w-3" /> HR
                              </>
                            )}
                          </Badge>
                          <div>
                            <p className="font-medium text-sm text-text-primary">
                              {slot.startsAt.toLocaleString()}
                            </p>
                            <p className="text-xs text-text-muted">
                              ends {slot.endsAt.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                        {slot.candidate && (
                          <Badge variant="success">
                            Booked: {slot.candidate.name}
                          </Badge>
                        )}
                      </div>

                      {slot.candidate && (
                        <p className="text-xs text-text-muted pl-1">
                          {slot.candidate.email} — in production, send calendar + email here.
                        </p>
                      )}

                      {geminiReady && slot.candidateId && slot.candidate && (
                        <ScheduleSlotEmailDrafts
                          jobId={job.id}
                          slotId={slot.id}
                          candidateId={slot.candidateId}
                        />
                      )}

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <form
                          action={assignSlotToCandidate.bind(null, slot.id, job.id)}
                          className="flex flex-col gap-3 sm:flex-row sm:items-end flex-1"
                        >
                          <div className="min-w-[200px] flex-1">
                            <label
                              className="block text-xs font-medium uppercase tracking-wider text-text-muted mb-1.5"
                              htmlFor={`c-${slot.id}`}
                            >
                              Assign candidate
                            </label>
                            <select
                              id={`c-${slot.id}`}
                              name="candidateId"
                              defaultValue={slot.candidateId ?? ""}
                              className="w-full rounded-xl border border-white/10 bg-surface-2 px-3 py-2.5 text-sm text-text-primary transition-all duration-200 hover:border-white/20 focus:outline-none focus:border-accent/60 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]"
                            >
                              <option value="">— Open —</option>
                              {job.candidates.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name} ({Math.round(c.rankScore!)} pts)
                                </option>
                              ))}
                            </select>
                          </div>
                          <button
                            type="submit"
                            className="inline-flex items-center gap-2 rounded-xl glass border border-white/10 px-4 py-2.5 text-sm font-medium text-text-primary transition-all duration-200 hover:bg-white/8 hover:border-white/20"
                          >
                            Save assignment
                          </button>
                        </form>

                        <form action={deleteInterviewSlot.bind(null, slot.id, job.id)}>
                          <button
                            type="submit"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/25 bg-red-500/8 px-3 py-2.5 text-xs font-medium text-red-400 transition-all duration-200 hover:bg-red-500/18 hover:border-red-500/40"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </form>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Section>

        </main>
      </div>
    </div>
  );
}
