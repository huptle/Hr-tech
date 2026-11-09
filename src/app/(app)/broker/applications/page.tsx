import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getBrokerApplications } from "@/app/actions/broker";
import { BrokerApplicationsView } from "./applications-view";

export const dynamic = "force-dynamic";

export default async function BrokerApplicationsPage() {
  const user = await requireUser();
  if (user.role.toLowerCase() !== "broker" && !user.isAdmin) {
    redirect("/");
  }

  const applications = await getBrokerApplications();
  return <BrokerApplicationsView applications={applications} />;
}
