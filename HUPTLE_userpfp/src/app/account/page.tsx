"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Mail, KeyRound, Sparkles } from "lucide-react";
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
    <DashboardLayout>
      <div className="container mx-auto px-6 md:px-8 py-16 max-w-md">
        <Card className="rounded-2xl border-border bg-card shadow-lg">
          <CardHeader className="space-y-2">
            <span className="text-[10px] bg-primary/10 text-primary px-2.5 py-1 rounded-full font-bold uppercase tracking-wider w-fit">
              Secure Access
            </span>
            <CardTitle className="text-xl font-extrabold text-foreground">Sign In to Profile</CardTitle>
            <CardDescription className="text-xs text-muted-foreground leading-relaxed">
              We will send you a one-time verification code via email. Please use the same email you entered when applying.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            {!otpSent ? (
              <form onSubmit={sendOtp} className="space-y-4">
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
                <Button type="submit" className="w-full h-11 text-sm font-bold shadow-md shadow-primary/10" disabled={loading || !email}>
                  {loading ? "Sending…" : "Send Verification Code"}
                </Button>
              </form>
            ) : (
              <form onSubmit={verifyOtp} className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  Verification code has been sent to <strong>{email}</strong>
                </p>
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-primary" /> Verification Code
                  </Label>
                  <Input
                    id="otp"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    className="h-11 border-border focus-visible:ring-primary/20 text-center tracking-widest font-mono text-lg"
                  />
                </div>
                <Button type="submit" className="w-full h-11 text-sm font-bold shadow-md shadow-primary/10" disabled={loading || !otp}>
                  {loading ? "Verifying…" : "Verify and Open Profile"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-10 border-border hover:bg-accent text-xs font-bold"
                  onClick={() => setOtpSent(false)}
                >
                  Use a different email
                </Button>
              </form>
            )}
            {error ? (
              <p className="text-xs text-destructive bg-destructive/10 rounded-lg p-3 font-semibold border border-destructive/20">{error}</p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
