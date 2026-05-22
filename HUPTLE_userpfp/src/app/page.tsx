import Link from "next/link";
import { Zap, ShieldCheck, Sparkles, Briefcase, ArrowRight } from "lucide-react";
import { ApplyPortalHeader } from "@/components/apply-portal-header";
import { ApplyForm } from "./apply-form";
import { JobsLoadError } from "@/components/jobs-load-error";
import { JobCard } from "@/components/job-card";
import { fetchPublicJobsFromHr } from "@/server/services/hr-portal.service";
import { LinkButton } from "@/components/link-button";

type PageProps = {
  searchParams: Promise<{ job?: string }>;
};

export default async function Home({ searchParams }: PageProps) {
  const sp = await searchParams;
  const jobId = sp.job?.trim() ?? "";

  let jobs: Awaited<ReturnType<typeof fetchPublicJobsFromHr>> = [];
  let selectedJob: (typeof jobs)[number] | undefined;
  let jobsError = "";
  try {
    jobs = await fetchPublicJobsFromHr();
    if (jobId) selectedJob = jobs.find((j) => j.id === jobId);
  } catch (e) {
    jobs = [];
    jobsError = e instanceof Error ? e.message : "Could not load jobs.";
  }

  if (jobId) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
        <ApplyPortalHeader />
        <main className="flex-1 container mx-auto px-6 md:px-12 lg:px-20 py-12 max-w-xl">
          <LinkButton href="/" variant="ghost" className="mb-6 -ml-2">
            ← Back to job board
          </LinkButton>
          {selectedJob ? (
            <ApplyForm jobId={jobId} jobTitle={selectedJob.title} />
          ) : (
            <ApplyForm jobId={jobId} />
          )}
        </main>
      </div>
    );
  }

  const preview = jobs.slice(0, 6);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <ApplyPortalHeader />

      <main className="flex-1 container mx-auto px-6 md:px-12 lg:px-20 py-12 md:py-16">
        <section className="max-w-3xl mb-14">
          <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary">
            Candidate portal
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight mt-6">
            Find your next role
          </h1>
          <p className="text-lg text-muted-foreground mt-4">
            Browse open positions, upload your resume for AI-powered job matches, and apply in one flow.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <LinkButton href="/jobs" size="lg" className="inline-flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Browse all jobs
            </LinkButton>
            <LinkButton
              href="/match"
              size="lg"
              variant="outline"
              className="inline-flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Get AI recommendations
            </LinkButton>
          </div>
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-14">
          <div className="flex gap-3 rounded-xl border border-border/40 p-4">
            <Zap className="w-5 h-5 text-primary shrink-0" />
            <div>
              <h3 className="font-semibold text-sm">Instant parsing</h3>
              <p className="text-xs text-muted-foreground mt-1">AI reads your PDF resume.</p>
            </div>
          </div>
          <div className="flex gap-3 rounded-xl border border-border/40 p-4">
            <Sparkles className="w-5 h-5 text-primary shrink-0" />
            <div>
              <h3 className="font-semibold text-sm">Smart matching</h3>
              <p className="text-xs text-muted-foreground mt-1">Ranked roles that fit your profile.</p>
            </div>
          </div>
          <div className="flex gap-3 rounded-xl border border-border/40 p-4">
            <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
            <div>
              <h3 className="font-semibold text-sm">HR pipeline</h3>
              <p className="text-xs text-muted-foreground mt-1">Applications sync to recruiters.</p>
            </div>
          </div>
        </div>

        <section>
          <div className="flex items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold">Open positions</h2>
            {jobs.length > 6 ? (
              <Link
                href="/jobs"
                className="text-sm font-medium text-primary inline-flex items-center gap-1 hover:underline"
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            ) : null}
          </div>

          {jobsError ? (
            <JobsLoadError message={jobsError} />
          ) : preview.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center border border-dashed border-border rounded-2xl">
              No live jobs published yet. HR can set job status to Live in the portal.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {preview.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
