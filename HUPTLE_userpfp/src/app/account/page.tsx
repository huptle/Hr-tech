"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApplyPortalHeader } from "@/components/apply-portal-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Mail, KeyRound } from "lucide-react";
import { useCandidateStore } from "@/store/useCandidateStore";
import { setSessionEmail } from "@/lib/candidate-session";
import type { ResumeData } from "@/server/services/resume.types";

export default function AccountPage() {
  const router = useRouter();
  const { setEmail, setProfile, setIsVerified } = useCandidateStore();
  const [email, setEmailLocal] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send code");
      setEmail(email);
      setOtpSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send code");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Invalid code");
      }

      const profRes = await fetch(`/api/profile?email=${encodeURIComponent(email)}`);
      const profData = await profRes.json();
      if (!profRes.ok || !profData.data) {
        throw new Error(
          "No saved profile for this email yet. Upload a resume from Get matched or Apply first.",
        );
      }

      const row = profData.data as Record<string, unknown>;
      const parsed =
        typeof row.parsed_data === "string"
          ? (JSON.parse(row.parsed_data) as ResumeData)
          : (row.parsed_data as ResumeData);

      setSessionEmail(email);
      setIsVerified(true);
      setProfile({
        name: String(row.name ?? ""),
        email: String(row.email ?? email),
        phone: String(row.phone ?? ""),
        skills: Array.isArray(row.skills) ? (row.skills as string[]) : [],
        experience: String(row.experience ?? ""),
        education: String(row.education ?? ""),
        summary: row.summary ? String(row.summary) : undefined,
        resumeUrl: row.resume_url ? String(row.resume_url) : undefined,
        parsed_data: parsed,
      });

      router.push("/profile");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed");
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
              We email you a one-time code (Supabase). Use the same email as when you applied or
              uploaded a resume.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!otpSent ? (
              <form onSubmit={sendOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" /> Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmailLocal(e.target.value)}
                    placeholder="you@email.com"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading || !email}>
                  {loading ? "Sending…" : "Send verification code"}
                </Button>
              </form>
            ) : (
              <form onSubmit={verifyOtp} className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Code sent to <strong>{email}</strong>
                </p>
                <div className="space-y-2">
                  <Label htmlFor="otp" className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4" /> Verification code
                  </Label>
                  <Input
                    id="otp"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading || !otp}>
                  {loading ? "Verifying…" : "Verify and open profile"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setOtpSent(false)}
                >
                  Use a different email
                </Button>
              </form>
            )}
            {error ? (
              <p className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{error}</p>
            ) : null}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
