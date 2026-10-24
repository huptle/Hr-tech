"use client";

import { useState, useTransition } from "react";
import { updateBrokerPayoutDetails } from "@/app/actions/broker";
import {
  Coins,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  CreditCard,
  QrCode,
  ShieldCheck,
  FileCheck,
} from "lucide-react";

type CommissionItem = {
  id: string;
  amount: number;
  rate: number;
  type: string;
  status: string;
  joiningDate: Date | null;
  verifiedAt: Date | null;
  paidAt: Date | null;
  transactionRef: string;
  notes: string;
  createdAt: Date;
  candidate: {
    id: string;
    name: string;
    email: string;
    journey: string;
  };
  job: {
    id: string;
    title: string;
    dept: string;
  };
};

export function BrokerCommissionsView({
  commissions,
  brokerCode,
  agencyName,
  payoutDetails,
  phone,
}: {
  commissions: CommissionItem[];
  brokerCode: string;
  agencyName: string;
  payoutDetails: string;
  phone: string;
}) {
  const [details, setDetails] = useState(payoutDetails);
  const [agency, setAgency] = useState(agencyName);
  const [contactPhone, setContactPhone] = useState(phone);
  const [isPending, startTransition] = useTransition();
  const [saveMsg, setSaveMsg] = useState("");

  let totalEarned = 0;
  let totalPending = 0;
  let totalPaid = 0;
  let totalReversed = 0;

  for (const c of commissions) {
    if (c.status === "Paid") {
      totalPaid += c.amount;
      totalEarned += c.amount;
    } else if (c.status === "Approved") {
      totalEarned += c.amount;
    } else if (c.status === "Pending") {
      totalPending += c.amount;
    } else if (c.status === "Reversed") {
      totalReversed += c.amount;
    }
  }

  const handleSavePayout = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveMsg("");
    const fd = new FormData();
    fd.set("payoutDetails", details);
    fd.set("agencyName", agency);
    fd.set("phone", contactPhone);

    startTransition(async () => {
      try {
        await updateBrokerPayoutDetails(fd);
        setSaveMsg("Payout details saved successfully!");
        setTimeout(() => setSaveMsg(""), 3000);
      } catch {
        setSaveMsg("Failed to save payout details.");
      }
    });
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Financial Ledger</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent/10 border border-accent/20 text-accent font-mono">
              {brokerCode}
            </span>
          </div>
          <h1 className="text-2xl font-black text-text-primary tracking-tight">Placement Commissions</h1>
          <p className="text-xs text-text-muted mt-1 font-medium">
            Track pending verification, approved earnings, transaction proofs, and payout disbursements.
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-surface border border-border">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Approved</span>
            <Coins size={18} className="text-accent" />
          </div>
          <div className="text-2xl font-black text-text-primary">₹{totalEarned.toLocaleString()}</div>
          <div className="text-[10px] text-text-muted mt-1 font-medium">Earned across verified placements</div>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-border">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Paid Out</span>
            <CheckCircle2 size={18} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-500">₹{totalPaid.toLocaleString()}</div>
          <div className="text-[10px] text-text-muted mt-1 font-medium">Disbursed via Bank / UPI</div>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-border">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Pending Verification</span>
            <Clock size={18} className="text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-500">₹{totalPending.toLocaleString()}</div>
          <div className="text-[10px] text-text-muted mt-1 font-medium">Awaiting candidate joining / verification</div>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-border">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Reversed</span>
            <AlertCircle size={18} className="text-red-500" />
          </div>
          <div className="text-2xl font-black text-text-muted">₹{totalReversed.toLocaleString()}</div>
          <div className="text-[10px] text-text-muted mt-1 font-medium">Candidate exited during probationary window</div>
        </div>
      </div>

      {/* Two Columns: Ledger Table + Payout Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ledger Table */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-surface border border-border flex flex-col gap-4">
          <div>
            <h2 className="text-base font-bold text-text-primary">Commission Transaction History</h2>
            <p className="text-xs text-text-muted mt-0.5">Itemized placement commission ledger</p>
          </div>

          {commissions.length === 0 ? (
            <div className="py-12 text-center text-xs text-text-muted">
              <Coins size={32} className="mx-auto text-text-muted mb-3 opacity-40" />
              <p className="font-bold">No commission records found.</p>
              <p className="mt-1">When you submit candidates against active jobs, commission records will be tracked here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-text-muted text-[10px] font-bold uppercase tracking-wider">
                    <th className="pb-3">Candidate & Job</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Transaction Proof / Ref</th>
                    <th className="pb-3 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {commissions.map((c) => (
                    <tr key={c.id} className="hover:bg-surface-2/50 transition-colors">
                      <td className="py-3">
                        <div className="font-bold text-text-primary">{c.candidate.name}</div>
                        <div className="text-text-muted text-[10px]">{c.job.title}</div>
                      </td>
                      <td className="py-3 font-bold text-text-primary">₹{c.amount.toLocaleString()}</td>
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
                      <td className="py-3 font-mono text-[11px] text-text-secondary">
                        {c.transactionRef ? (
                          <span className="text-accent">{c.transactionRef}</span>
                        ) : (
                          <span className="text-text-muted italic">—</span>
                        )}
                      </td>
                      <td className="py-3 text-right text-text-muted text-[10px]">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Payout Details Settings */}
        <div className="p-6 rounded-3xl bg-surface border border-border flex flex-col gap-4">
          <div>
            <h2 className="text-base font-bold text-text-primary">Payout Account Settings</h2>
            <p className="text-xs text-text-muted mt-0.5">Bank transfer & UPI destination for commission payments</p>
          </div>

          <form onSubmit={handleSavePayout} className="flex flex-col gap-3">
            <div>
              <label className="text-[10px] font-bold text-text-muted uppercase">Agency / Partner Name</label>
              <input
                type="text"
                value={agency}
                onChange={(e) => setAgency(e.target.value)}
                className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-xs text-text-primary outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-text-muted uppercase">Contact Phone</label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-xs text-text-primary outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-text-muted uppercase">
                Bank Account / UPI / IFSC Details
              </label>
              <textarea
                rows={4}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="UPI ID: apextalent@okaxis&#10;or:&#10;Account No: 1234567890&#10;IFSC: HDFC0001234&#10;Account Name: Apex Talent LLP"
                className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-xs text-text-primary font-mono outline-none focus:border-accent"
              />
            </div>

            {saveMsg && (
              <div className="text-xs font-bold text-emerald-500 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                {saveMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="mt-2 w-full py-2.5 rounded-xl gradient-bg text-white text-xs font-bold shadow-lg shadow-indigo-500/25 hover:scale-[1.01] transition-all disabled:opacity-60"
            >
              {isPending ? "Saving…" : "Save Payout Details"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
