import { Zap, ShieldCheck, BarChart } from "lucide-react";
import { ApplyForm } from "./apply-form";

type PageProps = {
  searchParams: Promise<{ job?: string }>;
};

function MissingJob() {
  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-8 text-center max-w-lg mx-auto">
      <h2 className="text-lg font-bold text-destructive">Invalid apply link</h2>
      <p className="text-sm text-muted-foreground mt-2">
        Ask HR for a job-specific link (it should include <code className="font-mono">?job=…</code>).
      </p>
    </div>
  );
}

export default async function Home({ searchParams }: PageProps) {
  const sp = await searchParams;
  const jobId = sp.job?.trim() ?? "";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="w-full border-b border-border/40 bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-8 md:px-16 lg:px-24 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl rounded-md">
              H
            </div>
            <span className="font-bold text-xl tracking-tight">Huptle Apply</span>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-8 md:px-16 lg:px-24 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-8 max-w-2xl">
          <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary">
            Candidate portal
          </span>
          <h1 className="text-5xl font-extrabold tracking-tight leading-tight">
            Apply with your resume
          </h1>
          <p className="text-lg text-muted-foreground">
            Upload a PDF — we parse your profile, store it securely, and notify the HR team for screening.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex gap-3">
              <Zap className="w-5 h-5 text-primary shrink-0" />
              <div>
                <h3 className="font-semibold">Instant parsing</h3>
                <p className="text-sm text-muted-foreground">Gemini extracts skills and experience.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
              <div>
                <h3 className="font-semibold">Secure storage</h3>
                <p className="text-sm text-muted-foreground">Resume file kept in Supabase.</p>
              </div>
            </div>
            <div className="flex gap-3 sm:col-span-2">
              <BarChart className="w-5 h-5 text-primary shrink-0" />
              <div>
                <h3 className="font-semibold">HR pipeline</h3>
                <p className="text-sm text-muted-foreground">
                  Your application syncs to the recruiter&apos;s job automatically.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative w-full max-w-lg mx-auto lg:ml-auto">
          {jobId ? <ApplyForm jobId={jobId} /> : <MissingJob />}
        </div>
      </main>
    </div>
  );
}
