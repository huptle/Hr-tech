"use client";

import { useActionState, useState } from "react";
import { signUp, type AuthFormState } from "@/app/actions/auth";
import { Building2, Handshake } from "lucide-react";

const initialState: AuthFormState = {};

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUp, initialState);
  const [accountType, setAccountType] = useState<"hr" | "broker">("hr");

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="accountType" value={accountType} />

      {/* Account Type Selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">
          I am joining as
        </label>
        <div className="grid grid-cols-2 gap-2 p-1 bg-surface-2 rounded-2xl border border-border">
          <button
            type="button"
            onClick={() => setAccountType("hr")}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              accountType === "hr"
                ? "bg-surface text-accent shadow-sm ring-1 ring-border"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            <Building2 size={16} />
            <span>Hiring Manager</span>
          </button>
          <button
            type="button"
            onClick={() => setAccountType("broker")}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              accountType === "broker"
                ? "bg-surface text-accent shadow-sm ring-1 ring-border"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            <Handshake size={16} />
            <span>Placement Partner</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">
          {accountType === "broker" ? "Contact Person Name" : "Full name"}
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          autoComplete="name"
          placeholder={accountType === "broker" ? "Rajesh Kumar" : "Jane Doe"}
          className="bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-accent transition-colors"
        />
      </div>

      {accountType === "broker" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="agencyName" className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">
              Agency / Firm Name
            </label>
            <input
              id="agencyName"
              name="agencyName"
              type="text"
              required
              placeholder="Apex Talent Partners"
              className="bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-accent transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="phone" className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">
              Contact Phone
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              placeholder="+91 98765 43210"
              className="bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-accent transition-colors"
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="designation" className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">
              Designation
            </label>
            <input
              id="designation"
              name="designation"
              type="text"
              defaultValue="HR Manager"
              className="bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-accent transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="company" className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">
              Company
            </label>
            <input
              id="company"
              name="company"
              type="text"
              placeholder="Acme Inc."
              className="bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-accent transition-colors"
            />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">
          {accountType === "broker" ? "Official / Agency Email" : "Work email"}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder={accountType === "broker" ? "partners@apextalent.in" : "you@company.com"}
          className="bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-accent transition-colors"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="At least 8 characters"
          className="bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-accent transition-colors"
        />
      </div>

      {state.error && (
        <p className="text-xs font-bold text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl gradient-bg px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100"
      >
        {pending ? "Creating…" : accountType === "broker" ? "Register as Placement Partner" : "Create HR Account"}
      </button>
    </form>
  );
}
