import { requireUser } from "@/lib/auth";
import { Dashboard } from "@/components/screens/Dashboard";
import { getDashboardData } from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard · Huptle HR" };

export default async function HomePage() {
  const user = await requireUser();
  const data = await getDashboardData();
  return (
    <Dashboard
      user={{ name: user.name, role: user.role }}
      {...data}
    />
  );
}
