import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import {
  getAdminBrokerList,
  getAdminBrokerJobs,
  getAdminCommissions,
} from "@/app/actions/admin-broker";
import { AdminBrokersView } from "./admin-brokers-view";

export const dynamic = "force-dynamic";

export default async function AdminBrokersPage() {
  const user = await requireUser();
  if (!user.isAdmin) {
    redirect("/");
  }

  const [brokers, jobs, commissions] = await Promise.all([
    getAdminBrokerList(),
    getAdminBrokerJobs(),
    getAdminCommissions(),
  ]);

  return (
    <AdminBrokersView
      brokers={brokers as any}
      jobs={jobs as any}
      commissions={commissions as any}
    />
  );
}
