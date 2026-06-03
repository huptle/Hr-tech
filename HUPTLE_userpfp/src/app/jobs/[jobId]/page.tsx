import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { ApplyForm } from "@/app/apply-form";
import { fetchPublicJobsFromHr } from "@/server/services/hr-portal.service";
import { LinkButton } from "@/components/link-button";
import { ArrowLeft, MapPin, Building2, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ jobId: string }> };

export default async function JobDetailPage({ params }: PageProps) {
  const { jobId } = await params;
  let job: Awaited<ReturnType<typeof fetchPublicJobsFromHr>>[number] | undefined;

  try {
    const jobs = await fetchPublicJobsFromHr();
    job = jobs.find((j) => j.id === jobId);
  } catch {
    notFound();
  }

  if (!job) notFound();

  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 md:px-8 py-10 space-y-6">
        <LinkButton
          href="/jobs"
          variant="ghost"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-accent -ml-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to all jobs
        </LinkButton>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Job Details Section */}
          <div className="lg:col-span-7 space-y-6 bg-card border border-border rounded-2xl p-6 md:p-8">
            <div>
              <span className="text-[10px] bg-primary/10 text-primary px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                Role Details
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground mt-3">
                {job.title}
              </h1>
              
              <div className="flex flex-wrap gap-4 text-xs font-semibold text-muted-foreground mt-3 pt-3 border-t border-border/60">
                {job.dept ? (
                  <span className="inline-flex items-center gap-1.5 bg-accent/40 px-2.5 py-1 rounded-lg">
                    <Building2 className="w-3.5 h-3.5" />
                    {job.dept}
                  </span>
                ) : null}
                {job.location ? (
                  <span className="inline-flex items-center gap-1.5 bg-accent/40 px-2.5 py-1 rounded-lg">
                    <MapPin className="w-3.5 h-3.5" />
                    {job.location}
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1.5 bg-accent/40 px-2.5 py-1 rounded-lg">
                  <Clock className="w-3.5 h-3.5" />
                  {job.mode}
                </span>
              </div>
            </div>

            <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap leading-relaxed text-sm">
              {job.description || "No description provided."}
            </div>
          </div>

          {/* Application Form Column */}
          <div className="lg:col-span-5">
            <ApplyForm jobId={job.id} jobTitle={job.title} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
