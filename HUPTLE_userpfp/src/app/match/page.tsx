import { ApplyPortalHeader } from "@/components/apply-portal-header";
import { MatchResumeForm } from "@/components/match-resume-form";

export default function MatchPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <ApplyPortalHeader />
      <main className="container mx-auto px-6 md:px-12 lg:px-20 py-16 max-w-lg">
        <MatchResumeForm />
      </main>
    </div>
  );
}
