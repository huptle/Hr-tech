import { markCandidateSelected } from "@/app/actions/candidates";
import { isGeminiConfigured } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";
import { ShortlistAiPanel } from "@/components/ai/shortlist-ai-panel";
import { notFound } from "next/navigation";
import { PageHeader, Section, ScoreBar, FadeUp } from "@/components/motion-wrappers";
import { Badge } from "@/components/ui/badge";
import {
  PageWrapper,
  PageLayout,
  SectionCard,
  BtnPrimary,
  LinkBtnSecondary,
  Breadcrumb,
  EmptyState,
  LinkBtnPrimary,
} from "@/components/ui/primitives";
import { Star, Calendar, Trophy, CheckCircle2, Briefcase } from "lucide-react";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ jobId: string }> };

export default async function ShortlistPage({ params }: PageProps) {
  const { jobId } = await params;
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      candidates: {
        where: { rankScore: { not: null } },
        orderBy: { rankScore: "desc" },
      },
    },
  });

  if (!job) notFound();

  const geminiReady = isGeminiConfigured();
  const top = job.candidates.slice(0, 10);

  return (
    <PageWrapper>
      <PageHeader className="border-b border-border/30 bg-background/60 backdrop-blur-sm">
        <PageLayout className="py-8">
          <Breadcrumb href={`/jobs/${job.id}`} label={job.title} />

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <Badge variant="warning" className="mb-2">
                <Star className="h-3 w-3" />
                Top shortlist
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight text-text-primary">
                Top candidates
              </h1>
              <p className="mt-1.5 text-sm text-text-secondary">
                {geminiReady
                  ? "Ranked with Gemini when you run screening; use tools below for panel narratives."
                  : "Ranked by simulated scores — add GEMINI_API_KEY for AI screening and summaries."}
              </p>
            </div>
            <div className="flex gap-2.5 flex-wrap">
              <LinkBtnSecondary href={`/jobs/${job.id}`}>
                <Briefcase className="h-4 w-4" />
                Workspace
              </LinkBtnSecondary>
              <LinkBtnSecondary href={`/jobs/${job.id}/schedule`}>
                <Calendar className="h-4 w-4 text-accent" />
                Schedule
              </LinkBtnSecondary>
            </div>
          </div>
        </PageLayout>
      </PageHeader>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {top.length === 0 ? (
          <FadeUp>
            <EmptyState
              icon={<Star className="h-7 w-7" />}
              title="No scores yet"
              iconBg="bg-warning/10"
              iconColor="text-warning/60"
              subtitle={
                <>
                  Add candidates and run{" "}
                  <strong className="text-text-secondary">screening</strong> on the job page.
                </>
              }
              action={
                <LinkBtnPrimary href={`/jobs/${job.id}`}>
                  Go to job
                </LinkBtnPrimary>
              }
            />
          </FadeUp>
        ) : (
          <Section delay={0.05}>
            {geminiReady && (
              <ShortlistAiPanel
                jobId={job.id}
                candidates={top.map((c) => ({
                  id: c.id,
                  name: c.name,
                  aiSummary: c.aiSummary,
                }))}
              />
            )}
            <SectionCard className="overflow-hidden">
              <ul className="divide-y divide-border/20">
                {top.map((c, idx) => (
                  <li
                    key={c.id}
                    className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between transition-colors hover:bg-accent/2"
                  >
                    <div className="flex gap-4 items-start">
                      {/* Rank badge */}
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent shadow-lg shadow-accent/20 text-sm font-bold text-white">
                        {idx === 0 ? (
                          <Trophy className="h-5 w-5" />
                        ) : (
                          idx + 1
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-text-primary">{c.name}</p>
                          {c.status === "selected" && (
                            <Badge variant="success">
                              <CheckCircle2 className="h-3 w-3" />
                              Selected hire
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-text-muted mt-0.5">{c.email}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                          <span>Joining: {c.joiningAvailability || "—"}</span>
                          <span>·</span>
                          <span>Resume {c.resumeVerified ? "verified ✓" : "pending"}</span>
                          <span>·</span>
                          <ScoreBar score={c.rankScore!} />
                        </div>
                        {c.aiSummary ? (
                          <p className="mt-2 text-xs text-text-secondary leading-relaxed border-l-2 border-accent/30 pl-3">
                            <span className="font-medium text-text-primary">AI summary: </span>
                            {c.aiSummary}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <form action={markCandidateSelected.bind(null, c.id, job.id)} className="shrink-0">
                      <BtnPrimary type="submit">
                        <CheckCircle2 className="h-4 w-4" />
                        Mark as selected
                      </BtnPrimary>
                    </form>
                  </li>
                ))}
              </ul>
            </SectionCard>
          </Section>
        )}
      </main>
    </PageWrapper>
  );
}
