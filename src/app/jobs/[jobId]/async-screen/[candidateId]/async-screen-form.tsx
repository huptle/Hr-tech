"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { submitAsyncScreening } from "@/app/actions/ai";
import { BtnPrimary, FormField, fieldInputClass } from "@/components/ui/primitives";
import { Loader2, Send } from "lucide-react";

type Q = { id: string; order: number; text: string };

export function AsyncScreeningForm({
  jobId,
  candidateId,
  questions,
}: {
  jobId: string;
  candidateId: string;
  questions: Q[];
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries(questions.map((q) => [q.id, ""])),
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = questions.map((q) => ({
      question: q.text,
      answer: (answers[q.id] ?? "").trim(),
    }));
    if (payload.some((p) => !p.answer)) {
      setError("Answer every question before submitting.");
      return;
    }
    setLoading(true);
    try {
      await submitAsyncScreening(jobId, candidateId, payload);
      router.push(`/jobs/${jobId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {questions.map((q) => (
        <FormField key={q.id} label={`${q.order + 1}. ${q.text}`} htmlFor={q.id}>
          <textarea
            id={q.id}
            rows={4}
            value={answers[q.id] ?? ""}
            onChange={(e) =>
              setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
            }
            className={`resize-y ${fieldInputClass.replace("mt-1 ", "")}`}
            placeholder="Type the candidate’s written answer…"
          />
        </FormField>
      ))}
      {error && <p className="text-sm text-red-400">{error}</p>}
      <BtnPrimary type="submit" disabled={loading}>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        Submit for Gemini scoring
      </BtnPrimary>
    </form>
  );
}
