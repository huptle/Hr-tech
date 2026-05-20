"use client";

import { useActionState } from "react";
import { Mic, Loader2 } from "lucide-react";
import {
  runVoiceScreeningForm,
  type ScreeningResult,
} from "@/app/actions/screening";
import { BtnPrimary } from "@/components/ui/primitives";

type Props = {
  jobId: string;
  pendingCount: number;
  totalCandidates: number;
  aiReady: boolean;
};

export function VoiceScreeningPanel({
  jobId,
  pendingCount,
  totalCandidates,
  aiReady,
}: Props) {
  const [state, formAction, isPending] = useActionState<
    ScreeningResult | null,
    FormData
  >(runVoiceScreeningForm, null);

  const allScored = pendingCount === 0 && totalCandidates > 0;
  const noCandidates = totalCandidates === 0;

  const subtitle = noCandidates
    ? "Add candidates first, then run screening."
    : aiReady
      ? pendingCount > 0
        ? `${pendingCount} candidate(s) ready for AI scoring from resume + JD context.`
        : "All candidates have scores. Re-run to refresh with AI."
      : pendingCount > 0
        ? `${pendingCount} candidate(s) need a score (configure AI on the server for real scoring).`
        : "All candidates have simulated scores. Re-run to refresh.";

  return (
    <div className="border-b border-border/30 px-6 py-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/15">
            <Mic className="h-4 w-4 text-accent" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-text-primary">
              {aiReady ? "AI screening" : "AI screening (simulated)"}
            </h2>
            <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {!allScored && !noCandidates && (
            <form action={formAction}>
              <input type="hidden" name="jobId" value={jobId} />
              <input type="hidden" name="rescoreAll" value="0" />
              <BtnPrimary
                type="submit"
                disabled={isPending}
                className="py-2 text-xs px-4"
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Mic className="h-3.5 w-3.5" />
                )}
                Run screening
              </BtnPrimary>
            </form>
          )}
          {allScored && (
            <form action={formAction}>
              <input type="hidden" name="jobId" value={jobId} />
              <input type="hidden" name="rescoreAll" value="1" />
              <BtnPrimary
                type="submit"
                disabled={isPending}
                className="py-2 text-xs px-4"
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Mic className="h-3.5 w-3.5" />
                )}
                Re-run screening
              </BtnPrimary>
            </form>
          )}
        </div>
      </div>

      {state && (
        <p
          className={`mt-3 text-xs rounded-lg px-3 py-2 ${
            state.ok
              ? "bg-success/10 text-success border border-success/20"
              : "bg-destructive/10 text-destructive border border-destructive/20"
          }`}
          role="status"
        >
          {state.message}
        </p>
      )}
    </div>
  );
}
