import Link from "next/link";
import { Zap, ShieldCheck, Sparkles, Briefcase, ArrowRight } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { ApplyForm } from "./apply-form";
import { JobsLoadError } from "@/components/jobs-load-error";
import { JobCard } from "@/components/job-card";
import { fetchPublicJobsFromHr } from "@/server/services/hr-portal.service";
import { LinkButton } from "@/components/link-button";
import { ClientGreeting } from "./client-greeting";

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
      <DashboardLayout>
        <div className="container mx-auto px-4 md:px-8 py-10 max-w-xl">
          <LinkButton href="/" variant="ghost" className="mb-6 -ml-2 hover:bg-accent">
            ← Back to jobs
          </LinkButton>
          {selectedJob ? (
            <ApplyForm jobId={jobId} jobTitle={selectedJob.title} />
          ) : (
            <ApplyForm jobId={jobId} />
          )}
        </div>
      </DashboardLayout>
    );
  }

  const preview = jobs.slice(0, 6);

  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 md:px-8 py-10 space-y-12">
        {/* Top welcome greeting (Matches Screenshot style) */}
        <section className="space-y-2">
          <span className="text-[10px] bg-primary/10 text-primary px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
            Candidate Portal
          </span>
          <ClientGreeting />
          <p className="text-sm text-muted-foreground max-w-xl">
            Browse active jobs, verify your skills with AI resume matching, and apply directly to our recruitment pipeline in seconds.
          </p>
        </section>

        {/* Metric Cards (Matches layout/design of screenshot) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Card 1 */}
          <div className="rounded-2xl border border-border bg-card p-5 flex flex-col justify-between hover:shadow-md transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                Total Roles Open
              </span>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black text-foreground">{jobs.length}</div>
              <span className="text-xs text-emerald-500 font-semibold mt-1 inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live positions
              </span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl border border-border bg-card p-5 flex flex-col justify-between hover:shadow-md transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                AI Matching Score
              </span>
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-500 group-hover:scale-110 transition-transform">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black text-foreground">Parser</div>
              <Link href="/match" className="text-xs text-primary font-semibold hover:underline mt-1 block">
                Match my resume →
              </Link>
            </div>
          </div>

          {/* Card 3 */}
          <div className="rounded-2xl border border-border bg-card p-5 flex flex-col justify-between hover:shadow-md transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                HR Sync Status
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black text-foreground">Synced</div>
              <span className="text-xs text-muted-foreground block mt-1">
                Direct hiring pipeline active
              </span>
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="flex gap-4 rounded-2xl border border-border/60 bg-card/50 p-5 hover:bg-card transition-colors duration-200">
            <Zap className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm text-foreground">Instant Parsing</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">AI analyzes your PDF resume instantly and pre-fills your entire profile details.</p>
            </div>
          </div>
          <div className="flex gap-4 rounded-2xl border border-border/60 bg-card/50 p-5 hover:bg-card transition-colors duration-200">
            <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm text-foreground">Smart Matching</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Calculate exact match scores and alignment analysis for open positions.</p>
            </div>
          </div>
          <div className="flex gap-4 rounded-2xl border border-border/60 bg-card/50 p-5 hover:bg-card transition-colors duration-200">
            <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm text-foreground">Recruiter Sync</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Applications sync directly to recruiters dashboard for priority screening.</p>
            </div>
          </div>
        </div>

        {/* Open Positions list */}
        <section className="space-y-6">
          <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">Featured Openings</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Explore positions hiring active candidates today.</p>
            </div>
            {jobs.length > 6 ? (
              <Link
                href="/jobs"
                className="text-xs font-semibold text-primary inline-flex items-center gap-1 hover:underline bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/10 transition-colors"
              >
                Browse All ({jobs.length}) <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : null}
          </div>

          {jobsError ? (
            <JobsLoadError message={jobsError} />
          ) : preview.length === 0 ? (
            <p className="text-muted-foreground text-sm py-12 text-center border border-dashed border-border bg-card/30 rounded-2xl">
              No live jobs published yet. Check back soon!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {preview.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
