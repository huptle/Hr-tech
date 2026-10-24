import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getEligibleJobs, getBrokerCandidates } from "@/app/actions/broker";
import { BrokerJobsView } from "./jobs-view";

export const dynamic = "force-dynamic";

export default async function BrokerJobsPage() {
  const user = await requireUser();
  if (user.role.toLowerCase() !== "broker" && !user.isAdmin) {
    redirect("/");
  }

  const [jobs, candidates] = await Promise.all([
    getEligibleJobs(),
    getBrokerCandidates(),
  ]);

  return <BrokerJobsView jobs={jobs} candidates={candidates} />;
}
