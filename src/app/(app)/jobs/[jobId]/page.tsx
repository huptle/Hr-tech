import { createCandidate, deleteCandidate } from "@/app/actions/candidates";
import { updateJob } from "@/app/actions/jobs";
import { runVoiceScreening } from "@/app/actions/screening";
import { isGeminiConfigured } from "@/lib/gemini";
import { requireUser } from "@/lib/auth";
import { jobWhereOwned, scopeFromUser } from "@/lib/hr-scope";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import {
  Section,
  PageHeader,
  ScoreBar,
} from "@/components/motion-wrappers";
import { Badge } from "@/components/ui/badge";
import {
  PageWrapper,
  PageLayout,
  SectionCard,
  SectionCardHeader,
  BtnPrimary,
  BtnDanger,
  LinkBtnSecondary,
  Breadcrumb,
  InitialAvatar,
} from "@/components/ui/primitives";
import Link from "next/link";
import {
  Users, FileText, Mic, Calendar, Star,
  Trash2, Settings2, MessageSquare, PenLine,
} from "lucide-react";
import { AddCandidateModal, JobSettingsModal } from "../components";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ jobId: string }> };

export default async function JobDetailPage({ params }: PageProps) {
  const { jobId } = await params;
  const user = await requireUser();
  const scope = scopeFromUser(user);
  const job = await prisma.job.findFirst({
    where: { id: jobId, ...jobWhereOwned(scope) },
    include: {
      questions: { orderBy: { order: "asc" } },
      candidates: { orderBy: { createdAt: "desc" } },
      slots: {
        orderBy: { startsAt: "asc" },
        include: { candidate: true },
      },
    },
  });

  if (!job) notFound();

  const geminiReady = isGeminiConfigured();
  const pendingScreening = job.candidates.filter((c) => c.rankScore === null);

  return (
    <PageWrapper>
      {/* Header */}
      <PageHeader className="border-b border-border/30 bg-background/60 backdrop-blur-sm">
        <PageLayout className="py-8">
          <Breadcrumb href="/jobs" label="Job portal" />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Badge variant="accent" className="mb-2">
                <Settings2 className="h-3 w-3" />
                Workspace
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight text-text-primary">
                {job.title}
              </h1>
              <p className="mt-1.5 text-sm text-text-secondary">
                {job.candidates.length} candidates · {job.questions.length} questions ·{" "}
                {job.screeningDurationMin} min screening
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5 shrink-0 sm:mt-1">
              <LinkBtnSecondary href={`/jobs/${job.id}/shortlist`}>
                <Star className="h-4 w-4 text-warning" />
                Top shortlist
              </LinkBtnSecondary>
              <LinkBtnSecondary href={`/jobs/${job.id}/schedule`}>
                <Calendar className="h-4 w-4 text-accent" />
                Schedule interviews
              </LinkBtnSecondary>
            </div>
          </div>
        </PageLayout>
      </PageHeader>

      <main className="mx-auto max-w-5xl space-y-6 px-6 py-10">

        {/* Job Description & Settings */}
        <Section delay={0.05}>
          <SectionCard>
            <SectionCardHeader
              icon={<FileText className="h-4 w-4" />}
              title="Job description & voice settings"
              right={
                <JobSettingsModal
                  job={job}
                  action={updateJob.bind(null, job.id)}
                  geminiReady={geminiReady}
                />
              }
            />
            <div className="p-6">
              <p className="text-sm text-text-secondary whitespace-pre-wrap">{job.description || "No description provided."}</p>
            </div>
          </SectionCard>
        </Section>

        {/* Voice Questions */}
        <Section delay={0.1}>
          <SectionCard>
            <SectionCardHeader
              icon={<MessageSquare className="h-4 w-4" />}
              title="Voice agent questions"
              iconBg="bg-accent-deep/15"
              iconColor="text-blue-300"
              right={<Badge variant="default">{job.questions.length}</Badge>}
            />
            <div className="p-6">
              <p className="text-sm text-text-secondary mb-4">
                Used for the screening round (integrate Vapi / Retell / etc. with this list).
              </p>
              <ol className="space-y-2.5">
                {job.questions.map((q, i) => (
                  <li
                    key={q.id}
                    className="flex gap-3 rounded-xl bg-surface-2/40 border border-border/20 px-4 py-3"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full gradient-bg text-[10px] font-bold text-white mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm text-text-secondary leading-relaxed">{q.text}</p>
                  </li>
                ))}
              </ol>
            </div>
          </SectionCard>
        </Section>

        {/* AI Screening */}
        <Section delay={0.15}>
          <SectionCard>
            <div className="flex items-center gap-3 border-b border-border/30 px-6 py-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15">
                <Mic className="h-4 w-4 text-accent" />
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-semibold text-text-primary">
                  {geminiReady ? "AI screening (Gemini)" : "AI screening (simulated)"}
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  {geminiReady
                    ? pendingScreening.length > 0
                      ? `${pendingScreening.length} candidate(s) ready for Gemini scoring from resume + JD context.`
                      : "Everyone has a score — new imports can be scored again."
                    : pendingScreening.length > 0
                      ? `${pendingScreening.length} candidate(s) still need a screening score (set GEMINI_API_KEY for real scoring).`
                      : "Everyone has a score — re-run only affects new imports."}
                </p>
              </div>
              <form action={runVoiceScreening.bind(null, job.id)}>
                <BtnPrimary type="submit" className="py-2 text-xs px-4">
                  <Mic className="h-3.5 w-3.5" />
                  Run screening
                </BtnPrimary>
              </form>
            </div>
          </SectionCard>
        </Section>

        {/* Candidates */}
        <Section delay={0.2}>
          <SectionCard>
            <SectionCardHeader
              icon={<Users className="h-4 w-4" />}
              title="Candidates"
              iconBg="bg-success/15"
              iconColor="text-success"
              right={
                <div className="flex items-center gap-3">
                  <Badge variant={job.candidates.length > 0 ? "success" : "default"}>
                    {job.candidates.length}
                  </Badge>
                  <AddCandidateModal action={createCandidate.bind(null, job.id)} />
                </div>
              }
            />

            {/* Candidate list */}
            {job.candidates.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-text-muted">No candidates yet. Add one above.</p>
              </div>
            ) : (
              <ul className="divide-y divide-border/20">
                {job.candidates.map((c) => (
                  <li
                    key={c.id}
                    className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between transition-colors hover:bg-accent/2"
                  >
                    <div className="flex items-start gap-3">
                      <InitialAvatar name={c.name} size="md" />
                      <div>
                        <p className="font-medium text-text-primary">{c.name}</p>
                        <p className="text-xs text-text-muted">{c.email}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <Badge
                            variant={
                              c.status === "selected"
                                ? "success"
                                : c.status === "screened"
                                  ? "accent"
                                  : "default"
                            }
                          >
                            {c.status}
                          </Badge>
                          {c.rankScore != null && <ScoreBar score={c.rankScore} />}
                          {c.resumeVerified && <Badge variant="success">Resume ✓</Badge>}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-stretch gap-2 sm:items-end shrink-0">
                      <Link
                        href={`/jobs/${job.id}/async-screen/${c.id}`}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl glass border border-border/40 px-3 py-2 text-xs font-medium text-text-primary hover:bg-accent/5"
                      >
                        <PenLine className="h-3.5 w-3.5" />
                        Async screen
                      </Link>
                      <form action={deleteCandidate.bind(null, c.id, job.id)}>
                        <BtnDanger type="submit">
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove
                        </BtnDanger>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </Section>

        {/* Upcoming Slots Preview */}
        <Section delay={0.25}>
          <SectionCard>
            <SectionCardHeader
              icon={<Calendar className="h-4 w-4" />}
              title={
                <span>
                  Upcoming slots{" "}
                  <span className="text-text-muted font-normal">(preview)</span>
                </span>
              }
              iconBg="bg-accent-2/15"
              iconColor="text-accent-2"
              right={
                <LinkBtnSecondary href={`/jobs/${job.id}/schedule`} className="text-xs px-3 py-1.5 rounded-lg">
                  Manage slots
                </LinkBtnSecondary>
              }
            />

            {job.slots.length === 0 ? (
              <div className="p-6">
                <p className="text-sm text-text-muted">No slots yet.</p>
              </div>
            ) : (
              <ul className="divide-y divide-border/20 px-6 py-2">
                {job.slots.slice(0, 5).map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Badge variant={s.mode === "ai" ? "ai" : "hr"}>
                        {s.mode === "ai" ? "AI" : "HR"}
                      </Badge>
                      <span className="text-sm text-text-secondary tabular-nums">
                        {s.startsAt.toLocaleString()}
                      </span>
                    </div>
                    <span className="text-xs text-text-muted">
                      {s.candidate ? s.candidate.name : "Open"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </Section>

      </main>
    </PageWrapper>
  );
}
