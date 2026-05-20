"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  generateShortlistComparison,
  refreshCandidateAiSummary,
} from "@/app/actions/ai";
import { BtnPrimary, BtnSecondary } from "@/components/ui/primitives";
import { Sparkles, Loader2 } from "lucide-react";

type CandidateRow = {
  id: string;
  name: string;
  aiSummary: string;
};

export function ShortlistAiPanel({
  jobId,
  candidates,
}: {
  jobId: string;
  candidates: CandidateRow[];
}) {
  const router = useRouter();
  const [comparison, setComparison] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [rowPending, setRowPending] = useState<string | null>(null);

  function runComparison() {
    setError(null);
    start(async () => {
      try {
        const text = await generateShortlistComparison(jobId);
        setComparison(text);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  async function summarizeOne(candidateId: string) {
    setError(null);
    setRowPending(candidateId);
    try {
      await refreshCandidateAiSummary(candidateId, jobId);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setRowPending(null);
    }
  }

  return (
    <div className="space-y-6 mb-8">
      <div className="rounded-2xl border border-border/30 bg-surface-2/30 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              Panel comparison (AI)
            </h2>
            <p className="text-xs text-text-muted mt-1">
              Compare top candidates and tradeoffs for this req.
            </p>
          </div>
          <BtnPrimary
            type="button"
            onClick={runComparison}
            disabled={pending}
            className="text-xs py-2"
          >
            {pending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            Generate comparison
          </BtnPrimary>
        </div>
        {error && (
          <p className="mt-3 text-xs text-red-400 whitespace-pre-wrap">{error}</p>
        )}
        {comparison && (
          <div className="mt-4 rounded-xl border border-border/20 bg-background/40 p-4 text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
            {comparison}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {candidates.map((c) => (
          <BtnSecondary
            key={c.id}
            type="button"
            className="text-xs py-1.5 px-3"
            onClick={() => summarizeOne(c.id)}
            disabled={rowPending !== null}
          >
            {rowPending === c.id ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3" />
            )}
            Blurb: {c.name.split(" ")[0]}
          </BtnSecondary>
        ))}
      </div>
    </div>
  );
}
