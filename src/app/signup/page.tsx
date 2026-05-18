import Link from "next/link";
import { SignUpForm } from "./form";

export const metadata = { title: "Create account · Huptle HR" };

export default function SignUpPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white text-lg font-black shadow-xl shadow-indigo-500/30">
            H
          </div>
          <h1 className="text-2xl font-black text-text-primary tracking-tight">
            Create your HR account
          </h1>
          <p className="text-sm text-text-muted mt-2 font-medium">
            Set up your Huptle HR workspace in seconds
          </p>
        </div>

        <div className="bg-surface border border-border rounded-3xl p-8 shadow-xl shadow-black/10">
          <SignUpForm />
        </div>

        <p className="text-center text-xs text-text-muted mt-6 font-medium">
          Already have an account?{" "}
          <Link href="/signin" className="text-accent font-bold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
