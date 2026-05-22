import { ApplyPortalHeader } from "@/components/apply-portal-header";
import { JobsLoadError } from "@/components/jobs-load-error";
import { JobCard } from "@/components/job-card";
import { fetchPublicJobsFromHr } from "@/server/services/hr-portal.service";
import { LinkButton } from "@/components/link-button";
import { Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  let jobs: Awaited<ReturnType<typeof fetchPublicJobsFromHr>> = [];
  let loadError = "";

  try {
    jobs = await fetchPublicJobsFromHr();
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Could not load jobs.";
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <ApplyPortalHeader />
      <main className="container mx-auto px-6 md:px-12 lg:px-20 py-12 flex-1">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Open positions</h1>
            <p className="text-muted-foreground mt-2">
              {jobs.length > 0
                ? `${jobs.length} live role${jobs.length === 1 ? "" : "s"} — apply directly or get AI recommendations.`
                : "Browse roles published by our HR team."}
            </p>
          </div>
          <LinkButton
            href="/match"
            variant="outline"
            className="inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Match my resume
          </LinkButton>
        </div>

        {loadError ? <JobsLoadError message={loadError} /> : null}

        {jobs.length === 0 && !loadError ? (
          <p className="text-muted-foreground text-center py-16">No open jobs right now. Check back soon.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
