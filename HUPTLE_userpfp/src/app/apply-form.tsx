"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Upload, Mail, CheckCircle2, SendHorizontal } from "lucide-react";
import { useCandidateStore } from "@/store/useCandidateStore";
import { setSessionEmail } from "@/lib/candidate-session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const ModernLoader = () => (
  <svg className="animate-spin mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

export function ApplyForm({ jobId, jobTitle }: { jobId: string; jobTitle?: string }) {
  const router = useRouter();
  const { email, setEmail, file, setFile, setProfile } = useCandidateStore();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
  };

  const handleSubmitProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !file || !jobId) return;

    setIsLoading(true);
    setErrorMsg("");
    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("file", file);
      formData.append("jobId", jobId);

      const res = await fetch("/api/resume", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to process application.");
      }

      setProfile(data.data);
      if (data.data?.email) setSessionEmail(data.data.email);
      router.push("/profile");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error processing application.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-2xl border-border/50 bg-card/95 backdrop-blur-sm overflow-hidden rounded-[1.5rem] flex flex-col">
      <AnimatePresence mode="wait">
        <motion.div
          key="process-form"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <form onSubmit={handleSubmitProcess}>
            <CardHeader className="pb-6 pt-8 px-8 border-b border-border/40 bg-muted/20">
              <CardTitle className="text-2xl">
                {jobTitle ? `Apply: ${jobTitle}` : "Apply for this role"}
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                {jobTitle ? (
                  <>Submit your resume for this opening.</>
                ) : (
                  <>
                    Job reference: <span className="font-mono text-xs">{jobId}</span>
                  </>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 pt-8 px-8">
              <div className="space-y-3">
                <Label htmlFor="resume" className="text-sm font-semibold">
                  Resume (PDF, max 2 pages)
                </Label>
                <div className="relative group">
                  <Input
                    id="resume"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Label
                    htmlFor="resume"
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-border rounded-xl cursor-pointer bg-muted/30 hover:bg-muted/50 hover:border-primary/50 transition-all"
                  >
                    {file ? (
                      <div className="flex items-center gap-2 text-primary font-medium">
                        <CheckCircle2 className="w-5 h-5" />
                        {file.name}
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-muted-foreground mb-2 group-hover:text-primary transition-colors" />
                        <span className="text-sm text-muted-foreground">Drop PDF or click to browse</span>
                      </>
                    )}
                  </Label>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="email" className="text-sm font-semibold flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12"
                />
              </div>

              {errorMsg && (
                <p className="text-sm text-destructive font-medium bg-destructive/10 p-3 rounded-lg">
                  {errorMsg}
                </p>
              )}

              <Button
                type="submit"
                disabled={isLoading || !email || !file}
                className="w-full h-12 text-base font-semibold"
              >
                {isLoading ? (
                  <>
                    <ModernLoader /> Processing…
                  </>
                ) : (
                  <>
                    <SendHorizontal className="w-5 h-5 mr-2" /> Submit application
                  </>
                )}
              </Button>
            </CardContent>
          </form>
        </motion.div>
      </AnimatePresence>
    </Card>
  );
}
