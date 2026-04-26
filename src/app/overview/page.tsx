import { OverviewCopilot } from "@/components/ai/overview-copilot";
import { isGeminiConfigured } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";
import { PIPELINE_STEPS } from "@/lib/pipeline";
import Link from "next/link";
import {
  StatCard,
  PageHeader,
  Section,
  StaggerOl,
  PipelineStep,
} from "@/components/motion-wrappers";
import { Badge } from "@/components/ui/badge";
import {
  PageWrapper,
  PageLayout,
  SectionCard,
  SectionHeading,
  LinkBtnPrimary,
  LinkBtnSecondary,
  InitialAvatar,
} from "@/components/ui/primitives";
import {
  Briefcase, Users, Zap, ArrowRight, PlugZap, ChevronRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const geminiReady = isGeminiConfigured();
  const [jobCount, candidateCount, jobs] = await Promise.all([
    prisma.job.count(),
    prisma.candidate.count(),
    prisma.job.findMany({
      take: 5,
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { candidates: true } } },
    }),
  ]);

  return (
    <PageWrapper>
      {/* Header */}
      <PageHeader className="border-b border-border/30 bg-background/60 backdrop-blur-sm">
        <PageLayout className="py-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Badge variant="accent" className="mb-3">
                <Zap className="h-3 w-3" />
                Recruitment Automation
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight text-text-primary">
                Voice screening{" "}
                <span className="gradient-text">→ rank → schedule</span>
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-text-secondary leading-relaxed">
                Manage jobs and candidates, simulate screening scores, build a
                top shortlist, and assign interview slots — ready to plug in
                voice AI, Calendar, and email.
              </p>
            </div>
            <div className="shrink-0">
              <LinkBtnPrimary href="/jobs">
                Job portal
                <ArrowRight className="h-4 w-4" />
              </LinkBtnPrimary>
            </div>
          </div>
        </PageLayout>
      </PageHeader>

      <main className="mx-auto max-w-5xl space-y-10 px-6 py-10">

        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Jobs"
            value={jobCount}
            delay={0.05}
            icon={<Briefcase className="h-4 w-4" />}
          />
          <StatCard
            label="Candidates"
            value={candidateCount}
            delay={0.12}
            icon={<Users className="h-4 w-4" />}
          />
          <StatCard
            label="Integrations"
            delay={0.19}
            icon={<PlugZap className="h-4 w-4" />}
            sub={
              <p className="text-sm text-text-muted leading-relaxed">
                {geminiReady
                  ? "Gemini is on for drafting, screening, and copilot. Calendar & email sending still stubbed."
                  : "Voice, Calendar & email sending stubbed — add GEMINI_API_KEY for AI features."}
              </p>
            }
          />
        </section>

        {geminiReady && (
          <Section delay={0.22}>
            <OverviewCopilot />
          </Section>
        )}

        {/* Recent Jobs */}
        {jobs.length > 0 && (
          <Section delay={0.25}>
            <SectionHeading
              right={
                <Link
                  href="/jobs"
                  className="flex items-center gap-1 text-xs font-medium text-text-muted hover:text-accent transition-colors"
                >
                  View all
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              }
            >
              Recent jobs
            </SectionHeading>

            <SectionCard>
              <ul className="divide-y divide-border/20">
                {jobs.map((job) => (
                  <li key={job.id}>
                    <Link
                      href={`/jobs/${job.id}`}
                      className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-accent/3"
                    >
                      <div className="flex items-center gap-3">
                        <InitialAvatar name={job.title} size="sm" shape="square" />
                        <span className="font-medium text-text-primary text-sm">
                          {job.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={job._count.candidates > 0 ? "accent" : "default"}>
                          {job._count.candidates} candidates
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-text-muted" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </SectionCard>
          </Section>
        )}

        {/* Pipeline */}
        <Section delay={0.3} aria-labelledby="pipeline-heading">
          <h2
            id="pipeline-heading"
            className="mb-4 text-xs font-semibold uppercase tracking-widest text-text-muted"
          >
            End-to-end pipeline
          </h2>
          <StaggerOl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PIPELINE_STEPS.map((step, i) => (
              <PipelineStep
                key={step.id}
                index={i + 1}
                title={step.title}
                detail={step.detail}
              />
            ))}
          </StaggerOl>
        </Section>

        {/* Next integrations */}
        <Section delay={0.35}>
          <SectionCard className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <PlugZap className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-semibold text-text-primary">
                Suggested next integrations
              </h2>
            </div>
            <ol className="space-y-2.5">
              {[
                "Voice provider webhooks → real transcripts & scoring",
                "Google Calendar OAuth → sync these slots",
                "Resend / SendGrid → booking + selection emails",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[10px] font-bold text-accent mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-sm text-text-secondary">{item}</span>
                </li>
              ))}
            </ol>
            <div className="mt-5">
              <LinkBtnSecondary href="/jobs">
                Start with a job
                <ArrowRight className="h-4 w-4" />
              </LinkBtnSecondary>
            </div>
          </SectionCard>
        </Section>

      </main>
    </PageWrapper>
  );
}
