"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Mail, KeyRound, ShieldCheck, ArrowRight, RotateCcw, CheckCircle2, UserCheck, AlertCircle } from "lucide-react";
import { useCandidateStore } from "@/store/useCandidateStore";
import { setSessionEmail, getSessionEmail, clearSessionEmail } from "@/lib/candidate-session";
import { profileFromSupabaseRow } from "@/lib/profile-from-row";

export default function AccountPage() {
  const router = useRouter();
  const { setEmail, setProfile, setIsVerified } = useCandidateStore();

  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmailLocal] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [existingSession, setExistingSession] = useState<string | null>(null);

  useEffect(() => {
    const active = getSessionEmail();
    if (active) {
      setExistingSession(active);
    }
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfoMessage("");
    setDevOtpHint(null);

    const normalized = email.trim().toLowerCase();
    if (!normalized || !normalized.includes("@")) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalized }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to send verification code.");
      }

      setStep("otp");
      setInfoMessage(`We sent a 6-digit verification code to ${normalized}`);
      if (data.testOtp) {
        setDevOtpHint(data.testOtp);
        setOtp(data.testOtp); // Auto-fill in dev mode for ease
      }
      setResendCooldown(30);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const normalized = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    if (cleanOtp.length < 6) {
      setError("Please enter the complete 6-digit code.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalized, otp: cleanOtp }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Invalid verification code.");
      }

      // Establish authenticated candidate session in client store
      setEmail(normalized);
      setSessionEmail(normalized);
      setIsVerified(true);

      // Attempt to load profile
      try {
        const profileRes = await fetch(`/api/profile?email=${encodeURIComponent(normalized)}`);
        const profileData = await profileRes.json();
        if (profileRes.ok && profileData.data) {
          setProfile(profileFromSupabaseRow(profileData.data as Record<string, unknown>, normalized));
          router.push("/profile");
          return;
        }
      } catch {
        // If no profile exists yet, redirect to match/upload
      }

      router.push("/match");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setLoading(false);
    }
  }

  function handleSwitchAccount() {
    clearSessionEmail();
    setExistingSession(null);
    setStep("email");
    setEmailLocal("");
    setOtp("");
    setError("");
    setInfoMessage("");
    setDevOtpHint(null);
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 md:px-8 py-16 max-w-md">
        <Card className="rounded-2xl border-border bg-card shadow-xl overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-primary/80 via-primary to-accent" />
          <CardHeader className="space-y-2 pb-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] bg-primary/10 text-primary px-3 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified Candidate Access
              </span>
              {step === "otp" && (
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setError("");
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground font-semibold flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" /> Change
                </button>
              )}
            </div>
            <CardTitle className="text-2xl font-extrabold text-foreground tracking-tight">
              {existingSession
                ? "Candidate Session Active"
                : step === "email"
                ? "Sign In to Your Profile"
                : "Enter Verification Code"}
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground leading-relaxed">
              {existingSession
                ? "You currently have an active authenticated candidate session."
                : step === "email"
                ? "Enter your email to receive a secure, one-time verification code."
                : infoMessage || "Enter the 6-digit code sent to your inbox."}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5 pt-2">
            {/* If an authenticated session is already active */}
            {existingSession ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-primary">
                    <UserCheck className="w-4 h-4" /> Logged In
                  </div>
                  <p className="text-sm font-extrabold text-foreground break-all">{existingSession}</p>
                </div>

                <Button
                  onClick={() => router.push("/profile")}
                  className="w-full h-11 text-sm font-bold shadow-md shadow-primary/15"
                >
                  Continue to Profile
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>

                <Button
                  variant="outline"
                  onClick={handleSwitchAccount}
                  className="w-full h-10 text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  Sign in with a different email
                </Button>
              </div>
            ) : step === "email" ? (
              /* Step 1: Email Input */
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5"
                  >
                    <Mail className="w-3.5 h-3.5 text-primary" /> Verified Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmailLocal(e.target.value)}
                    placeholder="candidate@example.com"
                    autoFocus
                    className="h-11 border-border focus-visible:ring-primary/20 text-sm font-medium"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 text-sm font-bold shadow-md shadow-primary/15"
                  disabled={loading || !email.trim()}
                >
                  {loading ? (
                    "Sending verification code…"
                  ) : (
                    <>
                      Send Verification Code
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            ) : (
              /* Step 2: 6-digit OTP Input */
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="otp"
                    className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-primary" /> 6-Digit Code
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    autoFocus
                    className="h-12 border-border focus-visible:ring-primary/20 text-center tracking-[0.35em] font-mono text-xl font-extrabold"
                  />
                </div>

                {devOtpHint && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-500" />
                    <span>Auto-detected code: <b>{devOtpHint}</b></span>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 text-sm font-bold shadow-md shadow-primary/15"
                  disabled={loading || otp.trim().length !== 6}
                >
                  {loading ? (
                    "Verifying…"
                  ) : (
                    <>
                      Verify & Access Profile
                      <CheckCircle2 className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>

                <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Didn&apos;t receive code?</span>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={resendCooldown > 0 || loading}
                    className="text-primary hover:underline font-bold disabled:opacity-50 disabled:no-underline"
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                  </button>
                </div>
              </form>
            )}

            {error ? (
              <div className="text-xs text-destructive bg-destructive/10 rounded-xl p-3 font-semibold border border-destructive/20 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
