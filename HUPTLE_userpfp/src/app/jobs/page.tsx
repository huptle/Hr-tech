import { DashboardLayout } from "@/components/dashboard-layout";
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
    <DashboardLayout>
      <div className="container mx-auto px-6 md:px-8 py-10 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              Open Positions
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              {jobs.length > 0
                ? `${jobs.length} live role${jobs.length === 1 ? "" : "s"} currently accepting applications.`
                : "Browse active positions in our hiring pipeline."}
            </p>
          </div>
          <LinkButton
            href="/match"
            variant="outline"
            className="inline-flex items-center gap-2 h-10 hover:bg-accent border-border"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            Match My Resume
          </LinkButton>
        </div>

        {loadError ? <JobsLoadError message={loadError} /> : null}

        {jobs.length === 0 && !loadError ? (
          <div className="text-center py-16 bg-card border border-dashed border-border rounded-2xl">
            <p className="text-sm text-muted-foreground">
              No open roles right now. Please check back soon!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
