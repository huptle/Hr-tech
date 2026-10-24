"use client";

import { useState, useTransition } from "react";
import {
  addBrokerCandidate,
  submitCandidateToJob,
  parseResumeWithAI,
} from "@/app/actions/broker";
import {
  Users,
  Plus,
  Search,
  Sparkles,
  Send,
  CheckCircle,
  FileText,
  Briefcase,
  AlertCircle,
  X,
  Building,
  MapPin,
  Clock,
} from "lucide-react";

type CandidateItem = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  location: string;
  skills: string;
  experienceYears: number;
  expectedSalary: string;
  currentCompany: string;
  notes: string;
  consentGiven: boolean;
  createdAt: Date;
  applications: Array<{
    id: string;
    job: { id: string; title: string; dept: string; location: string };
  }>;
};

type JobItem = {
  id: string;
  title: string;
  dept: string;
  location: string;
  commissionAmount: number;
  commissionType: string;
};

export function BrokerCandidatesView({
  candidates,
  jobs,
}: {
  candidates: CandidateItem[];
  jobs: JobItem[];
}) {
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState<CandidateItem | null>(null);

  // Add Candidate Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [skills, setSkills] = useState("");
  const [experienceYears, setExperienceYears] = useState("0");
  const [expectedSalary, setExpectedSalary] = useState("");
  const [currentCompany, setCurrentCompany] = useState("");
  const [notes, setNotes] = useState("");
  const [consentGiven, setConsentGiven] = useState(true);

  // Resume Text Parser
  const [resumeText, setResumeText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  // Submit to Job State
  const [selectedJobId, setSelectedJobId] = useState("");
  const [consentConfirmed, setConsentConfirmed] = useState(true);

  const [isPending, startTransition] = useTransition();

  const filtered = candidates.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.skills.toLowerCase().includes(q) ||
      c.location.toLowerCase().includes(q)
    );
  });

  const handleAiParse = async () => {
    if (!resumeText.trim()) return;
    setParsing(true);
    setSubmitError("");
    try {
      const parsed = await parseResumeWithAI(resumeText);
      if (parsed) {
        if (parsed.name) setName(parsed.name);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.phone) setPhone(parsed.phone);
        if (parsed.location) setLocation(parsed.location);
        if (Array.isArray(parsed.skills)) setSkills(parsed.skills.join(", "));
        if (parsed.experienceYears) setExperienceYears(String(parsed.experienceYears));
        if (parsed.currentCompany) setCurrentCompany(parsed.currentCompany);
        if (parsed.summary) setNotes(parsed.summary);
      }
    } catch (e: any) {
      setSubmitError(e.message || "Failed to parse resume.");
    } finally {
      setParsing(false);
    }
  };

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    const fd = new FormData();
    fd.set("name", name);
    fd.set("email", email);
    fd.set("phone", phone);
    fd.set("location", location);
    fd.set("skills", skills);
    fd.set("experienceYears", experienceYears);
    fd.set("expectedSalary", expectedSalary);
    fd.set("currentCompany", currentCompany);
    fd.set("notes", notes);
    fd.set("consentGiven", consentGiven ? "true" : "false");

    startTransition(async () => {
      try {
        await addBrokerCandidate(fd);
        setShowAddModal(false);
        // Reset
        setName("");
        setEmail("");
        setPhone("");
        setLocation("");
        setSkills("");
        setExperienceYears("0");
        setExpectedSalary("");
        setCurrentCompany("");
        setNotes("");
        setResumeText("");
      } catch (err: any) {
        setSubmitError(err.message || "Could not add candidate.");
      }
    });
  };

  const handleSubmitToJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showSubmitModal || !selectedJobId) return;
    setSubmitError("");
    setSubmitSuccess("");

    startTransition(async () => {
      try {
        await submitCandidateToJob({
          brokerCandidateId: showSubmitModal.id,
          jobId: selectedJobId,
          consentConfirmed,
        });
        setSubmitSuccess("Candidate application submitted successfully!");
        setTimeout(() => {
          setShowSubmitModal(null);
          setSubmitSuccess("");
          setSelectedJobId("");
        }, 1500);
      } catch (err: any) {
        setSubmitError(err.message || "Failed to submit candidate.");
      }
    });
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-text-primary tracking-tight">Talent Pool</h1>
          <p className="text-xs text-text-muted mt-1 font-medium">
            Maintain your candidate database, upload resumes, and submit authorized talent to live jobs.
          </p>
        </div>
        <button
          onClick={() => {
            setShowAddModal(true);
            setSubmitError("");
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-bg text-white text-xs font-bold shadow-lg shadow-indigo-500/25 hover:scale-[1.02] transition-all"
        >
          <Plus size={16} />
          <span>Add Candidate</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search candidates by name, email, skills, or location…"
          className="w-full bg-surface border border-border rounded-2xl pl-11 pr-4 py-3 text-xs text-text-primary outline-none focus:border-accent transition-colors"
        />
      </div>

      {/* Candidate Grid */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-surface border border-border">
          <Users size={32} className="mx-auto text-text-muted mb-3 opacity-40" />
          <h3 className="text-sm font-bold text-text-primary">No candidates found</h3>
          <p className="text-xs text-text-muted mt-1">
            {search ? "No candidates match your search query." : "Start building your placement talent pool by adding candidates."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="p-5 rounded-2xl bg-surface border border-border hover:border-accent/40 transition-all flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-black text-text-primary">{c.name}</h3>
                    <div className="text-xs text-text-muted font-mono">{c.email}</div>
                  </div>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <CheckCircle size={10} />
                    <span>Consent</span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary mt-3 font-medium">
                  {c.phone && <span>📞 {c.phone}</span>}
                  {c.location && <span>📍 {c.location}</span>}
                  {c.experienceYears > 0 && <span>💼 {c.experienceYears} yrs exp</span>}
                  {c.currentCompany && <span>🏢 {c.currentCompany}</span>}
                </div>

                {c.skills && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {c.skills.split(",").slice(0, 5).map((s, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-bold bg-surface-2 text-text-secondary px-2 py-0.5 rounded-md border border-border"
                      >
                        {s.trim()}
                      </span>
                    ))}
                  </div>
                )}

                {c.notes && (
                  <p className="text-xs text-text-muted mt-3 line-clamp-2 italic">
                    "{c.notes}"
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                <span className="text-[10px] text-text-muted font-bold">
                  {c.applications.length} {c.applications.length === 1 ? "application" : "applications"}
                </span>
                <button
                  onClick={() => {
                    setShowSubmitModal(c);
                    setSubmitError("");
                    setSubmitSuccess("");
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent/10 hover:bg-accent text-accent hover:text-white text-xs font-bold transition-all"
                >
                  <Send size={12} />
                  <span>Submit to Job</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Candidate Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-3xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-text-primary">Add Candidate to Pool</h2>
                <p className="text-xs text-text-muted">Enter details manually or paste resume text for AI extraction</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-xl hover:bg-surface-2 text-text-muted"
              >
                <X size={18} />
              </button>
            </div>

            {/* AI Resume Parser Box */}
            <div className="p-3.5 rounded-2xl bg-surface-2 border border-border flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                  <Sparkles size={14} className="text-accent" />
                  <span>AI Resume Extraction (Gemini)</span>
                </span>
                <button
                  type="button"
                  disabled={parsing || !resumeText.trim()}
                  onClick={handleAiParse}
                  className="px-3 py-1 rounded-xl bg-accent text-white text-[10px] font-bold disabled:opacity-50"
                >
                  {parsing ? "Extracting…" : "Auto-Fill Fields"}
                </button>
              </div>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                rows={3}
                placeholder="Paste candidate resume text or CV content here to auto-fill details…"
                className="w-full bg-surface border border-border rounded-xl p-2.5 text-xs text-text-primary outline-none focus:border-accent"
              />
            </div>

            <form onSubmit={handleAddCandidate} className="flex flex-col gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-text-muted uppercase">Candidate Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Aditya Sharma"
                    className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-xs text-text-primary outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-muted uppercase">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="aditya@example.com"
                    className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-xs text-text-primary outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-text-muted uppercase">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-xs text-text-primary outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-muted uppercase">Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Bengaluru, India"
                    className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-xs text-text-primary outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-text-muted uppercase">Key Skills (comma-separated)</label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="React, Next.js, TypeScript, PostgreSQL, Node.js"
                  className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-xs text-text-primary outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-text-muted uppercase">Experience (Years)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-xs text-text-primary outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-muted uppercase">Current Company</label>
                  <input
                    type="text"
                    value={currentCompany}
                    onChange={(e) => setCurrentCompany(e.target.value)}
                    placeholder="Infosys"
                    className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-xs text-text-primary outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-muted uppercase">Expected CTC</label>
                  <input
                    type="text"
                    value={expectedSalary}
                    onChange={(e) => setExpectedSalary(e.target.value)}
                    placeholder="₹18 LPA"
                    className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-xs text-text-primary outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-text-muted uppercase">Notes / Summary</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Short background summary or recruiter notes…"
                  className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-xs text-text-primary outline-none focus:border-accent"
                />
              </div>

              {/* Mandatory Candidate Consent */}
              <div className="p-3 rounded-xl bg-accent/5 border border-accent/20 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="consent"
                  required
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                  className="mt-0.5 accent-indigo-600"
                />
                <label htmlFor="consent" className="text-xs text-text-secondary leading-snug cursor-pointer">
                  <span className="font-bold text-text-primary">Candidate Authorization Verified: </span>
                  I confirm that the candidate has authorized our agency to represent them and submit applications on their behalf.
                </label>
              </div>

              {submitError && (
                <div className="text-xs font-bold text-red-500 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="mt-2 w-full py-3 rounded-xl gradient-bg text-white text-xs font-bold shadow-lg shadow-indigo-500/25 hover:scale-[1.01] transition-all disabled:opacity-60"
              >
                {isPending ? "Adding Candidate…" : "Add to Talent Pool"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Submit Candidate to Job Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-3xl p-6 max-w-lg w-full flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-text-primary">Submit Application</h2>
                <p className="text-xs text-text-muted">
                  Submitting <span className="font-bold text-text-primary">{showSubmitModal.name}</span> to a job
                </p>
              </div>
              <button
                onClick={() => setShowSubmitModal(null)}
                className="p-1 rounded-xl hover:bg-surface-2 text-text-muted"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitToJob} className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-bold text-text-muted uppercase mb-1 block">
                  Select Active Job Opening *
                </label>
                <select
                  required
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-xs text-text-primary outline-none focus:border-accent"
                >
                  <option value="">-- Choose an open job --</option>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title} · {j.dept} ({j.location}) — Commission: ₹{j.commissionAmount.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              {selectedJobId && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                  <div className="font-bold text-emerald-500">Placement Commission Guarantee</div>
                  <div className="text-text-secondary mt-1">
                    On successful candidate joining and verification, your agency earns{" "}
                    <span className="font-bold text-emerald-500">
                      ₹{jobs.find((j) => j.id === selectedJobId)?.commissionAmount.toLocaleString()}
                    </span>.
                  </div>
                </div>
              )}

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
                  I reconfirm that {showSubmitModal.name} has consented to applying for this specific position.
                </label>
              </div>

              {submitError && (
                <div className="text-xs font-bold text-red-500 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
                  {submitError}
                </div>
              )}

              {submitSuccess && (
                <div className="text-xs font-bold text-emerald-500 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                  {submitSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={isPending || !selectedJobId}
                className="w-full py-3 rounded-xl gradient-bg text-white text-xs font-bold shadow-lg shadow-indigo-500/25 hover:scale-[1.01] transition-all disabled:opacity-60"
              >
                {isPending ? "Submitting Application…" : "Submit Candidate Application"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
