import { notFound } from "next/navigation";
import { ApplyPortalHeader } from "@/components/apply-portal-header";
import { ApplyForm } from "@/app/apply-form";
import { fetchPublicJobsFromHr } from "@/server/services/hr-portal.service";
import { LinkButton } from "@/components/link-button";
import { ArrowLeft, MapPin, Building2 } from "lucide-react";

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
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <ApplyPortalHeader />
      <main className="container mx-auto px-6 md:px-12 lg:px-20 py-12">
        <LinkButton
          href="/jobs"
          variant="ghost"
          className="mb-6 -ml-2 inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          All jobs
        </LinkButton>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div className="space-y-6">
            <h1 className="text-3xl font-extrabold tracking-tight">{job.title}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {job.dept ? (
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" />
                  {job.dept}
                </span>
              ) : null}
              {job.location ? (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {job.location}
                </span>
              ) : null}
              <span>{job.mode}</span>
            </div>
            <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">
              {job.description || "No description provided."}
            </div>
          </div>
          <ApplyForm jobId={job.id} jobTitle={job.title} />
        </div>
      </main>
    </div>
  );
}
