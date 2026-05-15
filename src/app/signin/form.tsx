"use client";

import { useActionState } from "react";
import { signIn, type AuthFormState } from "@/app/actions/auth";

const initialState: AuthFormState = {};

export function SignInForm() {
  const [state, action, pending] = useActionState(signIn, initialState);

  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@company.com"
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
          autoComplete="current-password"
          placeholder="••••••••"
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
        className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-white shadow-lg shadow-accent/25 transition-all duration-200 hover:shadow-accent/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
