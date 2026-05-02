import { createJob } from "@/app/actions/jobs";
import { isGeminiConfigured } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { FadeUp, Section, PageHeader } from "@/components/motion-wrappers";
import { Badge } from "@/components/ui/badge";
import {
  PageWrapper,
  PageLayout,
  SectionCard,
  SectionHeading,
  EmptyState,
} from "@/components/ui/primitives";
import { Briefcase, Clock } from "lucide-react";
import { CreateJobFormModal, JobRowActions } from "./components";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const geminiReady = isGeminiConfigured();
  const jobs = await prisma.job.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { candidates: true } },
    },
  });

  return (
    <PageWrapper>
      {/* Header */}
      <PageHeader className="border-b border-border/30 bg-background/60 backdrop-blur-sm">
        <PageLayout className="py-10">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="accent">
                  <Briefcase className="h-3 w-3" />
                  HR Portal
                </Badge>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-text-primary">
                All Jobs
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-text-secondary leading-relaxed">
                Manage every open role.{" "}
                <span className="text-text-primary font-medium">Click a job</span>{" "}
                to access candidates, screening, and interviews for that role.
              </p>
            </div>
            <div className="shrink-0 mt-2 sm:mt-0">
              <CreateJobFormModal action={createJob} geminiReady={geminiReady} />
            </div>
          </div>
        </PageLayout>
      </PageHeader>

      <main className="mx-auto max-w-5xl space-y-8 px-6 py-10">

        {/* Jobs Table */}
        <Section delay={0.15}>
          <SectionHeading>
            Your jobs
            {jobs.length > 0 && (
              <span className="ml-2 rounded-full bg-accent/15 px-2 py-0.5 text-accent text-xs font-medium">
                {jobs.length}
              </span>
            )}
          </SectionHeading>

          {jobs.length === 0 ? (
            <FadeUp>
              <EmptyState
                icon={<Briefcase className="h-6 w-6" />}
                title="No jobs yet"
                subtitle={
                  <>
                    Use <strong className="text-text-secondary">Post a new job</strong> above to get started.
                  </>
                }
              />
            </FadeUp>
          ) : (
            <SectionCard className="overflow-visible">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border/30">
                    {["Job", "Candidates", "Last updated", "Action"].map((h, i) => (
                      <th
                        key={h}
                        className={`px-5 py-3.5 text-xs font-semibold uppercase tracking-widest text-text-muted${i === 3 ? " text-right" : ""}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr
                      key={job.id}
                      className="border-b border-border/20 last:border-0 transition-colors hover:bg-accent/3"
                    >
                      <td className="px-5 py-4">
                        <Link
                          href={`/jobs/${job.id}`}
                          className="font-medium text-text-primary hover:text-accent transition-colors"
                        >
                          {job.title}
                        </Link>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-text-muted">
                          <Clock className="h-3 w-3" />
                          {job.screeningDurationMin} min screening
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={job._count.candidates > 0 ? "accent" : "default"}>
                          {job._count.candidates}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-xs text-text-muted tabular-nums">
                        {job.updatedAt.toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <JobRowActions jobId={job.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </SectionCard>
          )}
        </Section>

      </main>
    </PageWrapper>
  );
}
