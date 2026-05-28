"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApplyPortalHeader } from "@/components/apply-portal-header";
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
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <ApplyPortalHeader />
      <main className="container mx-auto px-6 md:px-12 lg:px-20 py-16 max-w-md">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>
              Enter the email you used when applying or uploading a resume. No verification code
              required.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={signIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmailLocal(e.target.value)}
                  placeholder="you@email.com"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading || !email.trim()}>
                {loading ? (
                  "Signing in…"
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign in
                  </>
                )}
              </Button>
            </form>
            {error ? (
              <p className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{error}</p>
            ) : null}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
