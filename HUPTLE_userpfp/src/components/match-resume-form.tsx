"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Sparkles, Upload, CheckCircle2 } from "lucide-react";
import { useCandidateStore } from "@/store/useCandidateStore";
import { setSessionEmail } from "@/lib/candidate-session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { JobRecommendation } from "@/server/services/hr-portal.service";
import type { ResumeData } from "@/server/services/resume.types";

const ModernLoader = () => (
  <svg className="animate-spin mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

export function MatchResumeForm() {
  const router = useRouter();
  const { email, setEmail, file, setFile, setProfile, setRecommendations } = useCandidateStore();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
  };

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
      if (parsed.userInfo.email) setSessionEmail(parsed.userInfo.email);
      router.push("/match/results");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg border-border bg-card rounded-2xl flex flex-col overflow-hidden">
      <CardHeader className="pb-6 pt-6 px-6 border-b border-border/60 bg-accent/25">
        <span className="text-[10px] bg-primary/10 text-primary px-2.5 py-1 rounded-full font-bold uppercase tracking-wider w-fit">
          AI Tool
        </span>
        <CardTitle className="text-xl font-extrabold text-foreground flex items-center gap-2 mt-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Smart Match Maker
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
          Upload your PDF resume — our AI agent will analyze your skills and rank open positions matching your background.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-5 pt-6 px-6 pb-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* File Dropzone */}
          <div className="space-y-2">
            <Label htmlFor="match-resume" className="text-xs font-bold text-muted-foreground uppercase">
              Resume (PDF, max 2MB)
            </Label>
            <div className="relative group">
              <Input
                id="match-resume"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
                required
              />
              <Label
                htmlFor="match-resume"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer bg-accent/10 hover:bg-accent/35 hover:border-primary/50 transition-all select-none"
              >
                {file ? (
                  <div className="flex flex-col items-center gap-1.5 p-3 text-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 animate-bounce" />
                    <span className="text-xs font-bold text-foreground max-w-[240px] truncate">{file.name}</span>
                    <span className="text-[10px] text-muted-foreground">Click or drop to replace</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center p-3 text-center">
                    <Upload className="w-7 h-7 text-muted-foreground mb-1 group-hover:text-primary transition-colors duration-200" />
                    <span className="text-xs font-bold text-foreground">Click to browse files</span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">or drag and drop PDF resume</span>
                  </div>
                )}
              </Label>
            </div>
          </div>

          {/* Email input */}
          <div className="space-y-2">
            <Label htmlFor="match-email" className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-primary" /> Email Address
            </Label>
            <Input
              id="match-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="h-11 border-border focus-visible:ring-primary/20"
            />
          </div>

          {errorMsg ? (
            <p className="text-xs text-destructive font-semibold bg-destructive/10 p-3 rounded-lg border border-destructive/20">{errorMsg}</p>
          ) : null}

          <Button type="submit" disabled={isLoading || !email || !file} className="w-full h-11 text-sm font-bold shadow-md shadow-primary/10 active:scale-98">
            {isLoading ? (
              <>
                <ModernLoader /> Analyzing Resume…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" /> Find Matching Jobs
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
