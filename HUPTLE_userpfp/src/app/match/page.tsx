import { DashboardLayout } from "@/components/dashboard-layout";
import { MatchResumeForm } from "@/components/match-resume-form";

export default function MatchPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 md:px-8 py-12 max-w-xl">
        <MatchResumeForm />
      </div>
    </DashboardLayout>
  );
}
