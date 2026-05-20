"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Mail, Sparkles } from "lucide-react";
import { useCandidateStore } from "@/store/useCandidateStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { JobRecommendation } from "@/server/services/hr-portal.service";
import type { ResumeData } from "@/server/services/resume.types";

export function MatchResumeForm() {
  const router = useRouter();
  const { email, setEmail, file, setFile, setProfile, setRecommendations } = useCandidateStore();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !file) return;

    setIsLoading(true);
    setErrorMsg("");
    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("file", file);

      const res = await fetch("/api/match", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to analyze resume.");
      }

      const parsed = data.data.parsed_data as ResumeData;
      setProfile({
        name: parsed.userInfo.name,
        email: parsed.userInfo.email,
        phone: parsed.userInfo.phone || "",
        skills: parsed.userInfo.skills,
        experience: "",
        education: "",
        summary: parsed.userInfo.summary ?? undefined,
        resumeUrl: data.data.resumeUrl,
        parsed_data: parsed,
      });
      setRecommendations((data.data.recommendations ?? []) as JobRecommendation[]);
      router.push("/match/results");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-xl border-border/50 rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Sparkles className="w-5 h-5 text-primary" />
          AI job matching
        </CardTitle>
        <CardDescription>
          Upload your resume — we&apos;ll rank open roles that fit your skills and experience.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="match-resume">Resume (PDF)</Label>
            <Input
              id="match-resume"
              type="file"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="match-email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" /> Email
            </Label>
            <Input
              id="match-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
            />
          </div>
          {errorMsg ? (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{errorMsg}</p>
          ) : null}
          <Button type="submit" disabled={isLoading || !email || !file} className="w-full h-11">
            {isLoading ? "Analyzing…" : "Find matching jobs"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
