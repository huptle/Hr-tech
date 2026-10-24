import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getBrokerCommissions, getBrokerDashboardStats } from "@/app/actions/broker";
import { BrokerCommissionsView } from "./commissions-view";

export const dynamic = "force-dynamic";

export default async function BrokerCommissionsPage() {
  const user = await requireUser();
  if (user.role.toLowerCase() !== "broker" && !user.isAdmin) {
    redirect("/");
  }

  const [commissions, stats] = await Promise.all([
    getBrokerCommissions(),
    getBrokerDashboardStats(),
  ]);

  return (
    <BrokerCommissionsView
      commissions={commissions}
      brokerCode={stats.brokerCode}
      agencyName={stats.agencyName}
      payoutDetails={user.brokerProfile?.payoutDetails || ""}
      phone={user.brokerProfile?.phone || user.phone}
    />
  );
}
