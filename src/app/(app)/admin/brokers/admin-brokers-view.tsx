"use client";

import { useState, useTransition } from "react";
import {
  updateBrokerStatus,
  updateJobApproval,
  approveCommission,
  markCommissionPaid,
  reverseCommission,
  type AdminBrokerItem,
  type AdminBrokerJobItem,
  type AdminCommissionItem,
} from "@/app/actions/admin-broker";
import {
  Handshake,
  Briefcase,
  Coins,
} from "lucide-react";

export function AdminBrokersView({
  brokers,
  jobs,
  commissions,
}: {
  brokers: AdminBrokerItem[];
  jobs: AdminBrokerJobItem[];
  commissions: AdminCommissionItem[];
}) {
  const [activeTab, setActiveTab] = useState<"brokers" | "jobs" | "commissions">("brokers");
  const [payoutInput, setPayoutInput] = useState<{ [key: string]: string }>({});
  const [actionMsg, setActionMsg] = useState("");

  const [isPending, startTransition] = useTransition();

  const handleBrokerStatus = (brokerId: string, status: "approved" | "rejected") => {
    startTransition(async () => {
      try {
        await updateBrokerStatus(brokerId, status);
        setActionMsg(`Broker status updated to ${status}.`);
        setTimeout(() => setActionMsg(""), 2500);
      } catch (e: unknown) {
        const err = e as Error;
        alert(err.message || "Failed to update broker status.");
      }
    });
  };

  const handleJobApproval = (jobId: string, approvalStatus: "approved" | "rejected") => {
    startTransition(async () => {
      try {
        await updateJobApproval(jobId, approvalStatus);
        setActionMsg(`Job opening ${approvalStatus}.`);
        setTimeout(() => setActionMsg(""), 2500);
      } catch (e: unknown) {
        const err = e as Error;
        alert(err.message || "Failed to update job approval.");
      }
    });
  };

  const handleApproveCommission = (commissionId: string) => {
    startTransition(async () => {
      try {
        await approveCommission(commissionId);
        setActionMsg("Commission approved! Ready for payout disbursement.");
        setTimeout(() => setActionMsg(""), 2500);
      } catch (e: unknown) {
        const err = e as Error;
        alert(err.message || "Failed to approve commission.");
      }
    });
  };

  const handleMarkPaid = (commissionId: string) => {
    const ref = payoutInput[commissionId];
    if (!ref || !ref.trim()) {
      alert("Please enter a transaction reference number / UTR / payment ID.");
      return;
    }
    startTransition(async () => {
      try {
        await markCommissionPaid(commissionId, ref);
        setActionMsg("Commission marked as Paid.");
        setTimeout(() => setActionMsg(""), 2500);
      } catch (e: unknown) {
        const err = e as Error;
        alert(err.message || "Failed to mark commission paid.");
      }
    });
  };

  const handleReverse = (commissionId: string) => {
    const promptReason = prompt("Reason for reversing or rejecting commission:") || "Candidate probationary exit";
    startTransition(async () => {
      try {
        await reverseCommission(commissionId, promptReason);
        setActionMsg("Commission reversed.");
        setTimeout(() => setActionMsg(""), 2500);
      } catch (e: unknown) {
        const err = e as Error;
        alert(err.message || "Failed to reverse commission.");
      }
    });
  };

  const pendingBrokersCount = brokers.filter((b) => b.status === "pending").length;
  const pendingJobsCount = jobs.filter((j) => j.approvalStatus === "pending_approval").length;
  const pendingCommissionsCount = commissions.filter((c) => c.status === "Pending").length;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Admin Controls</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent/10 border border-accent/20 text-accent">
              Placement Network
            </span>
          </div>
          <h1 className="text-2xl font-black text-text-primary tracking-tight">Placement Partners & Commissions</h1>
          <p className="text-xs text-text-muted mt-1 font-medium">
            Manage broker registrations, verify placements, approve partner jobs, and disburse payouts.
          </p>
        </div>
      </div>

      {actionMsg && (
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold">
          {actionMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <button
          onClick={() => setActiveTab("brokers")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "brokers"
              ? "bg-accent text-white shadow-sm"
              : "text-text-muted hover:text-text-primary hover:bg-surface-2"
          }`}
        >
          <Handshake size={14} />
          <span>Registered Brokers</span>
          {pendingBrokersCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white text-accent font-black">
              {pendingBrokersCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("jobs")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "jobs"
              ? "bg-accent text-white shadow-sm"
              : "text-text-muted hover:text-text-primary hover:bg-surface-2"
          }`}
        >
          <Briefcase size={14} />
          <span>Partner Job Openings</span>
          {pendingJobsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-black font-black">
              {pendingJobsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("commissions")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "commissions"
              ? "bg-accent text-white shadow-sm"
              : "text-text-muted hover:text-text-primary hover:bg-surface-2"
          }`}
        >
          <Coins size={14} />
          <span>Placement & Payout Verification</span>
          {pendingCommissionsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-black font-black">
              {pendingCommissionsCount}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Registered Brokers */}
      {activeTab === "brokers" && (
        <div className="p-6 rounded-3xl bg-surface border border-border flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-text-primary">All Placement Partners ({brokers.length})</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-text-muted text-[10px] font-bold uppercase tracking-wider">
                  <th className="pb-3">Broker ID & Agency</th>
                  <th className="pb-3">Contact</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Talent Pool</th>
                  <th className="pb-3">Applications</th>
                  <th className="pb-3">Commissions</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {brokers.map((b) => (
                  <tr key={b.id} className="hover:bg-surface-2/50 transition-colors">
                    <td className="py-3">
                      <div className="font-bold text-text-primary">{b.agencyName || b.user.name}</div>
                      <div className="text-[10px] font-mono text-accent">{b.brokerCode}</div>
                    </td>
                    <td className="py-3">
                      <div>{b.user.name}</div>
                      <div className="text-text-muted text-[10px]">{b.user.email}</div>
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          b.status === "approved"
                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                            : b.status === "rejected"
                            ? "bg-red-500/10 text-red-500 border border-red-500/20"
                            : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                        }`}
                      >
                        {b.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 font-bold text-text-primary">{b._count.candidates}</td>
                    <td className="py-3 font-bold text-text-primary">{b._count.applications}</td>
                    <td className="py-3 font-bold text-text-primary">{b._count.commissions}</td>
                    <td className="py-3 text-right">
                      {b.status === "pending" ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            disabled={isPending}
                            onClick={() => handleBrokerStatus(b.id, "approved")}
                            className="px-2.5 py-1 rounded-xl bg-emerald-500 text-white text-[10px] font-bold hover:bg-emerald-600 transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            disabled={isPending}
                            onClick={() => handleBrokerStatus(b.id, "rejected")}
                            className="px-2.5 py-1 rounded-xl bg-red-500/10 text-red-500 text-[10px] font-bold hover:bg-red-500/20 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      ) : b.status === "approved" ? (
                        <button
                          disabled={isPending}
                          onClick={() => handleBrokerStatus(b.id, "rejected")}
                          className="px-2.5 py-1 rounded-xl bg-surface-2 text-text-muted hover:text-red-500 text-[10px] font-bold transition-colors"
                        >
                          Revoke Access
                        </button>
                      ) : (
                        <button
                          disabled={isPending}
                          onClick={() => handleBrokerStatus(b.id, "approved")}
                          className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white text-[10px] font-bold transition-colors"
                        >
                          Re-Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Partner Job Openings */}
      {activeTab === "jobs" && (
        <div className="p-6 rounded-3xl bg-surface border border-border flex flex-col gap-4">
          <h2 className="text-base font-bold text-text-primary">Broker-Submitted Job Openings ({jobs.length})</h2>

          {jobs.length === 0 ? (
            <div className="py-12 text-center text-xs text-text-muted">No broker-posted jobs found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-text-muted text-[10px] font-bold uppercase tracking-wider">
                    <th className="pb-3">Job Title & Dept</th>
                    <th className="pb-3">Posted By Partner</th>
                    <th className="pb-3">Location & Mode</th>
                    <th className="pb-3">Commission</th>
                    <th className="pb-3">Approval Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {jobs.map((j) => (
                    <tr key={j.id} className="hover:bg-surface-2/50 transition-colors">
                      <td className="py-3 font-bold text-text-primary">
                        <div>{j.title}</div>
                        <div className="text-text-muted text-[10px]">{j.dept}</div>
                      </td>
                      <td className="py-3">
                        <div className="font-bold text-text-primary">{j.brokerPoster?.agencyName}</div>
                        <div className="text-accent text-[10px] font-mono">{j.brokerPoster?.brokerCode}</div>
                      </td>
                      <td className="py-3 text-text-secondary">
                        {j.location} ({j.mode})
                      </td>
                      <td className="py-3 font-bold text-emerald-500">₹{j.commissionAmount.toLocaleString()}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            j.approvalStatus === "approved"
                              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                              : j.approvalStatus === "rejected"
                              ? "bg-red-500/10 text-red-500 border border-red-500/20"
                              : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                          }`}
                        >
                          {j.approvalStatus.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {j.approvalStatus === "pending_approval" && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              disabled={isPending}
                              onClick={() => handleJobApproval(j.id, "approved")}
                              className="px-2.5 py-1 rounded-xl bg-emerald-500 text-white text-[10px] font-bold hover:bg-emerald-600 transition-colors"
                            >
                              Approve to Live
                            </button>
                            <button
                              disabled={isPending}
                              onClick={() => handleJobApproval(j.id, "rejected")}
                              className="px-2.5 py-1 rounded-xl bg-red-500/10 text-red-500 text-[10px] font-bold hover:bg-red-500/20 transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Placement & Commission Payouts */}
      {activeTab === "commissions" && (
        <div className="p-6 rounded-3xl bg-surface border border-border flex flex-col gap-4">
          <h2 className="text-base font-bold text-text-primary">
            Placement Verification & Commission Payouts ({commissions.length})
          </h2>

          {commissions.length === 0 ? (
            <div className="py-12 text-center text-xs text-text-muted">No commission records logged yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-text-muted text-[10px] font-bold uppercase tracking-wider">
                    <th className="pb-3">Candidate & Job</th>
                    <th className="pb-3">Placement Partner</th>
                    <th className="pb-3">Hiring Stage</th>
                    <th className="pb-3">Payout Amount</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Verification & Payout Ref</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {commissions.map((c) => (
                    <tr key={c.id} className="hover:bg-surface-2/50 transition-colors">
                      <td className="py-3">
                        <div className="font-bold text-text-primary">{c.candidate.name}</div>
                        <div className="text-text-muted text-[10px]">{c.job.title}</div>
                      </td>
                      <td className="py-3">
                        <div className="font-bold text-text-primary">{c.broker.agencyName}</div>
                        <div className="text-accent text-[10px] font-mono">{c.broker.brokerCode}</div>
                        {c.broker.payoutDetails && (
                          <div className="text-[9px] text-text-muted font-mono truncate max-w-[150px]">
                            {c.broker.payoutDetails}
                          </div>
                        )}
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-2 border border-border text-text-secondary">
                          {c.candidate.journey}
                        </span>
                      </td>
                      <td className="py-3 font-bold text-emerald-500">₹{c.amount.toLocaleString()}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            c.status === "Paid"
                              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                              : c.status === "Approved"
                              ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                              : c.status === "Reversed"
                              ? "bg-red-500/10 text-red-500 border border-red-500/20"
                              : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3">
                        {c.status === "Approved" ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              placeholder="UTR / Txn ID…"
                              value={payoutInput[c.id] || ""}
                              onChange={(e) =>
                                setPayoutInput((prev) => ({ ...prev, [c.id]: e.target.value }))
                              }
                              className="bg-surface-2 border border-border rounded-lg px-2 py-1 text-[11px] font-mono outline-none focus:border-accent w-28"
                            />
                            <button
                              disabled={isPending}
                              onClick={() => handleMarkPaid(c.id)}
                              className="px-2 py-1 rounded-lg bg-emerald-500 text-white text-[10px] font-bold"
                            >
                              Pay
                            </button>
                          </div>
                        ) : c.status === "Paid" ? (
                          <span className="font-mono text-[11px] text-accent font-bold">
                            {c.transactionRef}
                          </span>
                        ) : (
                          <span className="text-text-muted italic text-[10px]">—</span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        {c.status === "Pending" ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              disabled={isPending}
                              onClick={() => handleApproveCommission(c.id)}
                              className="px-2.5 py-1 rounded-xl bg-blue-500 text-white text-[10px] font-bold hover:bg-blue-600 transition-colors"
                            >
                              Approve Placement
                            </button>
                            <button
                              disabled={isPending}
                              onClick={() => handleReverse(c.id)}
                              className="px-2 py-1 rounded-xl bg-surface-2 text-text-muted hover:text-red-500 text-[10px] font-bold transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        ) : c.status === "Approved" ? (
                          <button
                            disabled={isPending}
                            onClick={() => handleReverse(c.id)}
                            className="px-2 py-1 rounded-xl bg-red-500/10 text-red-500 text-[10px] font-bold"
                          >
                            Reverse
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
