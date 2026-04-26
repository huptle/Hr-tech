import { AsyncScreeningForm } from "./async-screen-form";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/motion-wrappers";
import { PageWrapper, PageLayout, Breadcrumb } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ jobId: string; candidateId: string }> };

export default async function AsyncScreenPage({ params }: PageProps) {
  const { jobId, candidateId } = await params;
  const cand = await prisma.candidate.findFirst({
    where: { id: candidateId, jobId },
    include: {
      job: {
        include: { questions: { orderBy: { order: "asc" } } },
      },
    },
  });

  if (!cand) notFound();

  const questions = cand.job.questions;

  return (
    <PageWrapper>
      <PageHeader className="border-b border-border/30 bg-background/60 backdrop-blur-sm">
        <PageLayout className="py-8">
          <Breadcrumb href={`/jobs/${jobId}`} label={cand.job.title} />
          <h1 className="mt-4 text-2xl font-bold text-text-primary">
            Async text screening
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {cand.name} — answer each question; Gemini scores and updates the candidate
            profile (same fields as voice screening).
          </p>
        </PageLayout>
      </PageHeader>

      <main className="mx-auto max-w-3xl px-6 py-10">
        {questions.length === 0 ? (
          <p className="text-sm text-text-muted">
            This job has no screening questions yet. Add them from the job workspace.
          </p>
        ) : (
          <AsyncScreeningForm
            jobId={jobId}
            candidateId={candidateId}
            questions={questions}
          />
        )}
      </main>
    </PageWrapper>
  );
}
