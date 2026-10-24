import { redirect } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getBrokerDashboardStats, getBrokerApplications } from "@/app/actions/broker";
import {
  Users,
  Briefcase,
  FileCheck,
  CalendarCheck,
  Award,
  Coins,
  ArrowUpRight,
  Plus,
  ShieldCheck,
  AlertCircle,
  Clock,
  CheckCircle2,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BrokerDashboardPage() {
  const user = await requireUser();
  if (user.role.toLowerCase() !== "broker" && !user.isAdmin) {
    redirect("/");
  }

  const [stats, applications] = await Promise.all([
    getBrokerDashboardStats(),
    getBrokerApplications(),
  ]);

  const isPending = stats.status === "pending";

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto flex flex-col gap-8">
      {/* Pending Approval Banner */}
      {isPending && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start sm:items-center gap-3.5 text-amber-600 dark:text-amber-400">
          <Clock size={20} className="shrink-0 mt-0.5 sm:mt-0" />
          <div className="flex-1 text-xs">
            <span className="font-bold">Broker Account Pending Verification: </span>
            Your placement partner account is currently under review by Huptle Admin. You can build your candidate pool and browse jobs now; submissions will be verified upon activation.
          </div>
        </div>
      )}

      {/* Hero / Partner Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-surface border border-border relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Placement Partner Portal</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent/10 border border-accent/20 text-accent font-mono">
              {stats.brokerCode}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              stats.status === "approved"
                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
            }`}>
              {stats.status.toUpperCase()}
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-text-primary tracking-tight">
            {stats.agencyName || user.name}
          </h1>
          <p className="text-xs text-text-muted mt-1 font-medium">
            Connect verified candidates with hiring managers and track placement commissions in real time.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 relative z-10">
          <Link
            href="/broker/candidates"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-bg text-white text-xs font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] transition-all"
          >
            <Plus size={16} />
            <span>Add Candidate</span>
          </Link>
          <Link
            href="/broker/jobs"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-2 border border-border text-text-primary text-xs font-bold hover:border-accent transition-colors"
          >
            <Briefcase size={16} />
            <span>Browse Jobs</span>
          </Link>
        </div>
      </div>

      {/* 6 KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Candidate Pool</span>
            <Users size={16} className="text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-text-primary">{stats.totalCandidates}</div>
          <div className="text-[10px] text-text-muted mt-1 font-medium">In your talent pool</div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Submissions</span>
            <FileCheck size={16} className="text-blue-500" />
          </div>
          <div className="text-2xl font-black text-text-primary">{stats.totalApplications}</div>
          <div className="text-[10px] text-text-muted mt-1 font-medium">Applications submitted</div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Interviews</span>
            <CalendarCheck size={16} className="text-amber-500" />
          </div>
          <div className="text-2xl font-black text-text-primary">{stats.interviewsScheduled}</div>
          <div className="text-[10px] text-text-muted mt-1 font-medium">Active screening / rounds</div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Selected / Hired</span>
            <Award size={16} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-500">{stats.candidatesSelected}</div>
          <div className="text-[10px] text-text-muted mt-1 font-medium">Placement confirmed</div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Pending Payout</span>
            <Coins size={16} className="text-amber-500" />
          </div>
          <div className="text-xl font-black text-amber-500">₹{stats.commissionsPending.toLocaleString()}</div>
          <div className="text-[10px] text-text-muted mt-1 font-medium">Under placement verification</div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Paid Out</span>
            <CheckCircle2 size={16} className="text-accent" />
          </div>
          <div className="text-xl font-black text-text-primary">₹{stats.commissionsPaid.toLocaleString()}</div>
          <div className="text-[10px] text-text-muted mt-1 font-medium">Transferred to bank/UPI</div>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/broker/candidates"
          className="p-5 rounded-2xl bg-surface border border-border hover:border-accent transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Users size={20} />
            </div>
            <h3 className="text-sm font-bold text-text-primary">Manage Talent Pool</h3>
            <p className="text-xs text-text-muted mt-1 font-medium">
              Upload resumes, extract skills & experience with Gemini AI, and maintain candidate authorization.
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-accent mt-4">
            <span>View candidates</span>
            <ArrowUpRight size={14} />
          </div>
        </Link>

        <Link
          href="/broker/jobs"
          className="p-5 rounded-2xl bg-surface border border-border hover:border-accent transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Briefcase size={20} />
            </div>
            <h3 className="text-sm font-bold text-text-primary">Explore Eligible Jobs</h3>
            <p className="text-xs text-text-muted mt-1 font-medium">
              Browse openings from hiring managers, view fixed & % commissions, and submit candidate resumes.
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-accent mt-4">
            <span>Explore openings</span>
            <ArrowUpRight size={14} />
          </div>
        </Link>

        <Link
          href="/broker/commissions"
          className="p-5 rounded-2xl bg-surface border border-border hover:border-accent transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Coins size={20} />
            </div>
            <h3 className="text-sm font-bold text-text-primary">Commission Ledger & Payouts</h3>
            <p className="text-xs text-text-muted mt-1 font-medium">
              Track pending verification, approved earnings, payment transaction proofs, and configure payout details.
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-accent mt-4">
            <span>View ledger</span>
            <ArrowUpRight size={14} />
          </div>
        </Link>
      </div>

      {/* Recent Submissions Table */}
      <div className="p-6 rounded-3xl bg-surface border border-border flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-text-primary">Recent Candidate Submissions</h2>
            <p className="text-xs text-text-muted mt-0.5">Tracking live application status across hiring funnels</p>
          </div>
          <Link href="/broker/applications" className="text-xs font-bold text-accent hover:underline">
            View all ({applications.length})
          </Link>
        </div>

        {applications.length === 0 ? (
          <div className="py-12 text-center text-xs text-text-muted">
            <p className="font-bold">No candidate applications submitted yet.</p>
            <p className="mt-1">Add candidates to your talent pool and submit them against active job openings.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-text-muted text-[10px] font-bold uppercase tracking-wider">
                  <th className="pb-3">Candidate</th>
                  <th className="pb-3">Job Opening</th>
                  <th className="pb-3">Submitted</th>
                  <th className="pb-3">Hiring Stage</th>
                  <th className="pb-3 text-right">Commission Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {applications.slice(0, 5).map((app) => {
                  const comm = app.commissions[0];
                  return (
                    <tr key={app.id} className="hover:bg-surface-2/50 transition-colors">
                      <td className="py-3 font-bold text-text-primary">{app.name}</td>
                      <td className="py-3 text-text-secondary">{app.job.title}</td>
                      <td className="py-3 text-text-muted">{new Date(app.createdAt).toLocaleDateString()}</td>
                      <td className="py-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-accent/10 text-accent border border-accent/20">
                          {app.journey}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {comm ? (
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            comm.status === "Paid"
                              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                              : comm.status === "Approved"
                              ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                              : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                          }`}>
                            ₹{comm.amount.toLocaleString()} ({comm.status})
                          </span>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
