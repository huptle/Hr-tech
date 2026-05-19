import { requireUser } from "@/lib/auth";
import { Dashboard } from "@/components/screens/Dashboard";
import { getDashboardData } from "@/lib/dashboard-data";
import { scopeFromUser } from "@/lib/hr-scope";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard · Huptle HR" };

export default async function HomePage() {
  const user = await requireUser();
  const scope = scopeFromUser(user);
  const data = await getDashboardData(scope);
  return (
    <Dashboard
      user={{ name: user.name, role: user.role }}
      activityScope={user.isAdmin ? "all" : "mine"}
      {...data}
    />
  );
}
