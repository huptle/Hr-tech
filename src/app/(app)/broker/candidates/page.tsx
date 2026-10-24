import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getBrokerCandidates, getEligibleJobs } from "@/app/actions/broker";
import { BrokerCandidatesView } from "./candidates-view";

export const dynamic = "force-dynamic";

export default async function BrokerCandidatesPage() {
  const user = await requireUser();
  if (user.role.toLowerCase() !== "broker" && !user.isAdmin) {
    redirect("/");
  }

  const [candidates, jobs] = await Promise.all([
    getBrokerCandidates(),
    getEligibleJobs(),
  ]);

  return <BrokerCandidatesView candidates={candidates as any} jobs={jobs as any} />;
}
