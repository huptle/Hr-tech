"use client";

import { useState, useTransition } from "react";
import { submitCandidateToJob, postBrokerJob } from "@/app/actions/broker";
import {
  Briefcase,
  Search,
  Filter,
  Plus,
  Send,
  Building,
  MapPin,
  Coins,
  CheckCircle,
  X,
  Users,
  ShieldAlert,
} from "lucide-react";

type JobItem = {
  id: string;
  title: string;
  description: string;
  dept: string;
  location: string;
  mode: string;
  commissionType: string;
  commissionAmount: number;
  createdAt: Date;
  _count: { candidates: number };
};

type CandidateItem = {
  id: string;
  name: string;
  email: string;
  skills: string;
  experienceYears: number;
};

export function BrokerJobsView({
  jobs,
  candidates,
}: {
  jobs: JobItem[];
  candidates: CandidateItem[];
}) {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState("all");

  const [showSubmitModal, setShowSubmitModal] = useState<JobItem | null>(null);
  const [showPostJobModal, setShowPostJobModal] = useState(false);

  // Submit Candidate Form
  const [selectedCandId, setSelectedCandId] = useState("");
  const [consentConfirmed, setConsentConfirmed] = useState(true);

  // Post Job Form
  const [jobTitle, setJobTitle] = useState("");
  const [jobDept, setJobDept] = useState("Engineering");
  const [jobLocation, setJobLocation] = useState("Remote");
  const [jobMode, setJobMode] = useState("Remote");
  const [jobDesc, setJobDesc] = useState("");
  const [commissionAmount, setCommissionAmount] = useState("25000");

  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const departments = Array.from(new Set(jobs.map((j) => j.dept).filter(Boolean)));

  const filtered = jobs.filter((j) => {
    const q = search.toLowerCase();
    const matchSearch =
      j.title.toLowerCase().includes(q) ||
      j.description.toLowerCase().includes(q) ||
      j.dept.toLowerCase().includes(q) ||
      j.location.toLowerCase().includes(q);
    const matchDept = deptFilter === "all" || j.dept.toLowerCase() === deptFilter.toLowerCase();
    const matchMode = modeFilter === "all" || j.mode.toLowerCase() === modeFilter.toLowerCase();
    return matchSearch && matchDept && matchMode;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showSubmitModal || !selectedCandId) return;
    setErrorMsg("");
    setSuccessMsg("");

    startTransition(async () => {
      try {
        await submitCandidateToJob({
          brokerCandidateId: selectedCandId,
          jobId: showSubmitModal.id,
          consentConfirmed,
        });
        setSuccessMsg("Application submitted successfully!");
        setTimeout(() => {
          setShowSubmitModal(null);
          setSuccessMsg("");
          setSelectedCandId("");
        }, 1500);
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to submit candidate.");
      }
    });
  };

  const handlePostJob = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const fd = new FormData();
    fd.set("title", jobTitle);
    fd.set("dept", jobDept);
    fd.set("location", jobLocation);
    fd.set("mode", jobMode);
    fd.set("description", jobDesc);
    fd.set("commissionAmount", commissionAmount);

    startTransition(async () => {
      try {
        await postBrokerJob(fd);
        setSuccessMsg("Job opening posted! It has been submitted for Admin approval.");
        setTimeout(() => {
          setShowPostJobModal(false);
          setSuccessMsg("");
          setJobTitle("");
          setJobDesc("");
        }, 1500);
      } catch (err: any) {
        setErrorMsg(err.message || "Could not post job opening.");
      }
    });
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-text-primary tracking-tight">Job Openings</h1>
          <p className="text-xs text-text-muted mt-1 font-medium">
            Browse eligible jobs posted by hiring managers, view commission payouts, and submit candidates.
          </p>
        </div>
        <button
          onClick={() => {
            setShowPostJobModal(true);
            setErrorMsg("");
            setSuccessMsg("");
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-bg text-white text-xs font-bold shadow-lg shadow-indigo-500/25 hover:scale-[1.02] transition-all"
        >
          <Plus size={16} />
          <span>Post Authorized Job</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search jobs by title, department, skills, or location…"
            className="w-full bg-surface border border-border rounded-2xl pl-11 pr-4 py-3 text-xs text-text-primary outline-none focus:border-accent transition-colors"
          />
        </div>

        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="bg-surface border border-border rounded-2xl px-4 py-3 text-xs text-text-primary outline-none focus:border-accent"
        >
          <option value="all">All Departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <select
          value={modeFilter}
          onChange={(e) => setModeFilter(e.target.value)}
          className="bg-surface border border-border rounded-2xl px-4 py-3 text-xs text-text-primary outline-none focus:border-accent"
        >
          <option value="all">All Work Modes</option>
          <option value="remote">Remote</option>
          <option value="hybrid">Hybrid</option>
          <option value="onsite">On-site</option>
        </select>
      </div>

      {/* Jobs Grid */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-surface border border-border">
          <Briefcase size={32} className="mx-auto text-text-muted mb-3 opacity-40" />
          <h3 className="text-sm font-bold text-text-primary">No active jobs found</h3>
          <p className="text-xs text-text-muted mt-1">Try adjusting your filters or search keywords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((j) => (
            <div
              key={j.id}
              className="p-5 rounded-2xl bg-surface border border-border hover:border-accent/40 transition-all flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-black text-text-primary leading-snug">{j.title}</h3>
                    <div className="text-xs text-text-muted font-medium mt-0.5">{j.dept}</div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 whitespace-nowrap">
                    ₹{j.commissionAmount.toLocaleString()} Payout
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-text-secondary mt-3 font-medium">
                  <span className="flex items-center gap-1">
                    <MapPin size={12} className="text-text-muted" />
                    <span>{j.location || "Remote"}</span>
                  </span>
                  <span>·</span>
                  <span className="capitalize">{j.mode}</span>
                  <span>·</span>
                  <span className="text-text-muted">{j._count.candidates} applicants</span>
                </div>

                {j.description && (
                  <p className="text-xs text-text-muted mt-3 line-clamp-3 leading-relaxed">
                    {j.description}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                <span className="text-[10px] text-text-muted font-bold">
                  Posted {new Date(j.createdAt).toLocaleDateString()}
                </span>
                <button
                  onClick={() => {
                    setShowSubmitModal(j);
                    setErrorMsg("");
                    setSuccessMsg("");
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl gradient-bg text-white text-xs font-bold shadow-md shadow-indigo-500/20 hover:scale-[1.02] transition-all"
                >
                  <Send size={12} />
                  <span>Submit Candidate</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submit Candidate Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-3xl p-6 max-w-lg w-full flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-text-primary">Submit to "{showSubmitModal.title}"</h2>
                <p className="text-xs text-text-muted">
                  Commission: <span className="font-bold text-emerald-500">₹{showSubmitModal.commissionAmount.toLocaleString()}</span> on verified placement
                </p>
              </div>
              <button
                onClick={() => setShowSubmitModal(null)}
                className="p-1 rounded-xl hover:bg-surface-2 text-text-muted"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-bold text-text-muted uppercase mb-1 block">
                  Select from your Talent Pool *
                </label>
                {candidates.length === 0 ? (
                  <div className="p-4 rounded-xl bg-surface-2 text-xs text-text-muted text-center">
                    No candidates in your pool yet. Please add candidates in the Talent Pool tab first.
                  </div>
                ) : (
                  <select
                    required
                    value={selectedCandId}
                    onChange={(e) => setSelectedCandId(e.target.value)}
                    className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-xs text-text-primary outline-none focus:border-accent"
                  >
                    <option value="">-- Choose candidate --</option>
                    {candidates.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.email}) — {c.experienceYears} yrs exp
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Consent confirmation */}
              <div className="p-3 rounded-xl bg-surface-2 border border-border flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="confirmConsent"
                  required
                  checked={consentConfirmed}
                  onChange={(e) => setConsentConfirmed(e.target.checked)}
                  className="mt-0.5 accent-indigo-600"
                />
                <label htmlFor="confirmConsent" className="text-xs text-text-secondary leading-snug cursor-pointer">
                  I confirm that the selected candidate has given explicit consent to apply for this role.
                </label>
              </div>

              {errorMsg && (
                <div className="text-xs font-bold text-red-500 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="text-xs font-bold text-emerald-500 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                  {successMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={isPending || !selectedCandId || candidates.length === 0}
                className="w-full py-3 rounded-xl gradient-bg text-white text-xs font-bold shadow-lg shadow-indigo-500/25 hover:scale-[1.01] transition-all disabled:opacity-60"
              >
                {isPending ? "Submitting Application…" : "Submit Candidate Application"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Post Authorized Job Modal */}
      {showPostJobModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-3xl p-6 max-w-lg w-full flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-text-primary">Post Authorized Opening</h2>
                <p className="text-xs text-text-muted">
                  Jobs submitted by placement partners undergo quick Admin review before publishing live
                </p>
              </div>
              <button
                onClick={() => setShowPostJobModal(false)}
                className="p-1 rounded-xl hover:bg-surface-2 text-text-muted"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePostJob} className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] font-bold text-text-muted uppercase">Job Title *</label>
                <input
                  type="text"
                  required
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Senior Backend Engineer"
                  className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-xs text-text-primary outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-text-muted uppercase">Department</label>
                  <input
                    type="text"
                    required
                    value={jobDept}
                    onChange={(e) => setJobDept(e.target.value)}
                    placeholder="Engineering"
                    className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-xs text-text-primary outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-muted uppercase">Work Mode</label>
                  <select
                    value={jobMode}
                    onChange={(e) => setJobMode(e.target.value)}
                    className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-xs text-text-primary outline-none focus:border-accent"
                  >
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Onsite">Onsite</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-text-muted uppercase">Location</label>
                  <input
                    type="text"
                    required
                    value={jobLocation}
                    onChange={(e) => setJobLocation(e.target.value)}
                    placeholder="Bengaluru / Remote"
                    className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-xs text-text-primary outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-muted uppercase">Commission (₹)</label>
                  <input
                    type="number"
                    required
                    value={commissionAmount}
                    onChange={(e) => setCommissionAmount(e.target.value)}
                    className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-xs text-text-primary outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-text-muted uppercase">Job Description & Requirements</label>
                <textarea
                  required
                  rows={4}
                  value={jobDesc}
                  onChange={(e) => setJobDesc(e.target.value)}
                  placeholder="Key responsibilities, mandatory qualifications, tech stack…"
                  className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-xs text-text-primary outline-none focus:border-accent"
                />
              </div>

              {errorMsg && (
                <div className="text-xs font-bold text-red-500 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="text-xs font-bold text-emerald-500 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                  {successMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="mt-2 w-full py-3 rounded-xl gradient-bg text-white text-xs font-bold shadow-lg shadow-indigo-500/25 hover:scale-[1.01] transition-all disabled:opacity-60"
              >
                {isPending ? "Submitting Job…" : "Submit Opening for Admin Approval"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
