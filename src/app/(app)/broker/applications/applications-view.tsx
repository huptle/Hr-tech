"use client";

import { useState } from "react";
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowRight,
  ChevronRight,
  Sparkles,
  Coins,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

type ApplicationItem = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  location: string;
  journey: string;
  status: string;
  createdAt: Date;
  job: {
    id: string;
    title: string;
    dept: string;
    location: string;
  };
  commissions: Array<{
    id: string;
    amount: number;
    status: string;
    transactionRef: string;
  }>;
};

const STAGES = [
  "Applied",
  "Shortlisted",
  "Round 1",
  "Interview",
  "Selected",
  "Offer Sent",
  "Offer Accepted",
  "Joined",
  "Placement Confirmed",
];

function getStageStep(journey: string): number {
  if (journey === "Placement Confirmed" || journey === "Joined") return 5;
  if (journey === "Offer Accepted" || journey === "Offer Sent") return 4;
  if (journey === "Selected") return 3;
  if (journey.includes("Round") || journey.includes("Interview") || journey === "scheduled") return 2;
  if (journey === "Shortlisted" || journey === "shortlisted") return 1;
  return 0; // Applied
}

export function BrokerApplicationsView({
  applications,
}: {
  applications: ApplicationItem[];
}) {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");

  const filtered = applications.filter((app) => {
    const q = search.toLowerCase();
    const matchSearch =
      app.name.toLowerCase().includes(q) ||
      app.email.toLowerCase().includes(q) ||
      app.job.title.toLowerCase().includes(q) ||
      app.job.dept.toLowerCase().includes(q);
    const matchStage = stageFilter === "all" || app.journey.toLowerCase() === stageFilter.toLowerCase();
    return matchSearch && matchStage;
  });

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-text-primary tracking-tight">Application & Placement Tracking</h1>
        <p className="text-xs text-text-muted mt-1 font-medium">
          Follow the progress of your submitted candidates through the full hiring funnel in real time.
        </p>
      </div>

      {/* Funnel Pipeline Visual Guide */}
      <div className="p-4 rounded-3xl bg-surface border border-border overflow-x-auto">
        <div className="flex items-center justify-between min-w-[700px] text-xs">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-[10px] font-bold">1</span>
            <span className="font-bold text-text-primary">Applied</span>
          </div>
          <ChevronRight size={14} className="text-text-muted" />
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold">2</span>
            <span className="font-bold text-text-primary">Shortlisted</span>
          </div>
          <ChevronRight size={14} className="text-text-muted" />
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold">3</span>
            <span className="font-bold text-text-primary">Interview</span>
          </div>
          <ChevronRight size={14} className="text-text-muted" />
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-[10px] font-bold">4</span>
            <span className="font-bold text-text-primary">Selected / Offered</span>
          </div>
          <ChevronRight size={14} className="text-text-muted" />
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">5</span>
            <span className="font-bold text-emerald-500">Joined & Confirmed</span>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by candidate name, email, or job opening…"
            className="w-full bg-surface border border-border rounded-2xl pl-11 pr-4 py-3 text-xs text-text-primary outline-none focus:border-accent transition-colors"
          />
        </div>

        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="bg-surface border border-border rounded-2xl px-4 py-3 text-xs text-text-primary outline-none focus:border-accent"
        >
          <option value="all">All Stages</option>
          <option value="applied">Applied</option>
          <option value="shortlisted">Shortlisted</option>
          <option value="round 1">Interviewing</option>
          <option value="selected">Selected</option>
          <option value="offer accepted">Offer Accepted</option>
          <option value="joined">Joined</option>
        </select>
      </div>

      {/* Applications List */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-surface border border-border">
          <FileText size={32} className="mx-auto text-text-muted mb-3 opacity-40" />
          <h3 className="text-sm font-bold text-text-primary">No applications found</h3>
          <p className="text-xs text-text-muted mt-1">Submit candidates from your talent pool against active jobs.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((app) => {
            const step = getStageStep(app.journey);
            const comm = app.commissions[0];
            return (
              <div
                key={app.id}
                className="p-5 rounded-2xl bg-surface border border-border hover:border-accent/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-text-primary">{app.name}</h3>
                    <span className="text-xs text-text-muted">({app.email})</span>
                  </div>
                  <div className="text-xs text-text-secondary mt-1 font-medium">
                    Applied for <span className="font-bold text-text-primary">{app.job.title}</span> · {app.job.dept}
                  </div>
                  <div className="text-[10px] text-text-muted mt-1">
                    Submitted on {new Date(app.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Funnel Progress Indicator */}
                <div className="flex flex-col gap-1.5 min-w-[200px]">
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className="text-text-muted uppercase">Stage</span>
                    <span className="text-accent">{app.journey}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-2 overflow-hidden flex gap-0.5">
                    {[0, 1, 2, 3, 4, 5].map((s) => (
                      <div
                        key={s}
                        className={`flex-1 h-full rounded-full transition-all ${
                          s <= step
                            ? s === 5
                              ? "bg-emerald-500"
                              : "bg-accent"
                            : "bg-border/60"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Commission Info */}
                <div className="text-right shrink-0">
                  {comm ? (
                    <div>
                      <div className="text-sm font-black text-text-primary">
                        ₹{comm.amount.toLocaleString()}
                      </div>
                      <div className="flex items-center justify-end gap-1 text-[10px] font-bold mt-0.5">
                        <span
                          className={`px-2 py-0.5 rounded-full ${
                            comm.status === "Paid"
                              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                              : comm.status === "Approved"
                              ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                              : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                          }`}
                        >
                          {comm.status}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-text-muted">—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
