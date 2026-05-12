import { requireUser } from "@/lib/auth";
import { Shell } from "@/components/Shell";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <Shell user={{ name: user.name, role: user.role, initials: user.initials }}>
      {children}
    </Shell>
  );
}
