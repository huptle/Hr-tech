"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Mail, LogIn } from "lucide-react";
import { useCandidateStore } from "@/store/useCandidateStore";
import { setSessionEmail } from "@/lib/candidate-session";
import { profileFromSupabaseRow } from "@/lib/profile-from-row";

export default function AccountPage() {
  const router = useRouter();
  const { setEmail, setProfile, setIsVerified } = useCandidateStore();
  const [email, setEmailLocal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/profile?email=${encodeURIComponent(normalized)}`);
      const data = await res.json();

      if (!res.ok || !data.data) {
        throw new Error(
          "No profile found for this email. Apply to a job or upload a resume first.",
        );
      }

      setEmail(normalized);
      setSessionEmail(normalized);
      setIsVerified(true);
      setProfile(profileFromSupabaseRow(data.data as Record<string, unknown>, normalized));
      router.push("/profile");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 md:px-8 py-16 max-w-md">
        <Card className="rounded-2xl border-border bg-card shadow-lg">
          <CardHeader className="space-y-2">
            <span className="text-[10px] bg-primary/10 text-primary px-2.5 py-1 rounded-full font-bold uppercase tracking-wider w-fit">
              Secure Access
            </span>
            <CardTitle className="text-xl font-extrabold text-foreground">Sign In to Profile</CardTitle>
            <CardDescription className="text-xs text-muted-foreground leading-relaxed">
              Enter the email you used when applying or uploading a resume. No verification code is required.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <form onSubmit={signIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-primary" /> Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmailLocal(e.target.value)}
                  placeholder="you@email.com"
                  className="h-11 border-border focus-visible:ring-primary/20"
                />
              </div>
              <Button type="submit" className="w-full h-11 text-sm font-bold shadow-md shadow-primary/10" disabled={loading || !email.trim()}>
                {loading ? (
                  "Signing in…"
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </>
                )}
              </Button>
            </form>
            {error ? (
              <p className="text-xs text-destructive bg-destructive/10 rounded-lg p-3 font-semibold border border-destructive/20">{error}</p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
