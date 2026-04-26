"use client";

import { useState } from "react";
import {
  recruitingCopilotAsk,
  recruitingFunnelInsight,
} from "@/app/actions/ai";
import { BtnPrimary, BtnSecondary, FormField, fieldInputClass } from "@/components/ui/primitives";
import { Loader2, Sparkles } from "lucide-react";

export function OverviewCopilot() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [insight, setInsight] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [loadingAsk, setLoadingAsk] = useState(false);

  async function ask() {
    setError(null);
    setLoadingAsk(true);
    try {
      const out = await recruitingCopilotAsk(question);
      setAnswer(out);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoadingAsk(false);
    }
  }

  async function snapshot() {
    setError(null);
    setLoadingInsight(true);
    try {
      const out = await recruitingFunnelInsight();
      setInsight(out);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoadingInsight(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border/30 bg-surface-2/20 p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-accent" />
        <h2 className="text-sm font-semibold text-text-primary">
          Recruitment copilot (Gemini)
        </h2>
      </div>
      <p className="text-xs text-text-muted leading-relaxed">
        Ask questions about your workspace snapshot (jobs, candidates, statuses)
        or generate a quick funnel insight.
      </p>

      <BtnSecondary
        type="button"
        onClick={snapshot}
        disabled={loadingInsight || loadingAsk}
        className="text-xs"
      >
        {loadingInsight ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Sparkles className="h-3.5 w-3.5" />
        )}
        Funnel insight snapshot
      </BtnSecondary>
      {insight && (
        <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed rounded-xl border border-border/20 bg-background/30 p-4">
          {insight}
        </p>
      )}

      <FormField label="Ask about this workspace" htmlFor="copilot-q">
        <textarea
          id="copilot-q"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
          placeholder="e.g. Which reqs look understaffed on candidates?"
          className={`resize-y ${fieldInputClass.replace("mt-1 ", "")}`}
        />
      </FormField>
      <BtnPrimary
        type="button"
        onClick={ask}
        disabled={loadingAsk || loadingInsight || !question.trim()}
      >
        {loadingAsk ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        Ask Gemini
      </BtnPrimary>

      {error && (
        <p className="text-xs text-red-400 whitespace-pre-wrap">{error}</p>
      )}
      {answer && (
        <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed rounded-xl border border-border/20 bg-background/30 p-4">
          {answer}
        </p>
      )}
    </div>
  );
}
