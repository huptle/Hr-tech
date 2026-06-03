"use client";

import { useState } from "react";
import {
  draftInterviewInviteEmail,
  draftOfferEmail,
  draftRejectionEmail,
} from "@/app/actions/ai";
import { BtnSecondary } from "@/components/ui/primitives";
import { Loader2, Mail } from "lucide-react";

export function ScheduleSlotEmailDrafts({
  jobId,
  slotId,
  candidateId,
}: {
  jobId: string;
  slotId: string;
  candidateId: string;
}) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(
    key: "invite" | "reject" | "offer",
    fn: () => Promise<string>,
  ) {
    setError(null);
    setLoading(key);
    try {
      const out = await fn();
      setText(out);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-white/8 bg-black/20 p-3 space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1">
        <Mail className="h-3 w-3" />
        AI email drafts (copy only — not sent)
      </p>
      <div className="flex flex-wrap gap-2">
        <BtnSecondary
          type="button"
          className="text-xs py-1.5 px-2.5"
          disabled={loading !== null}
          onClick={() =>
            run("invite", () => draftInterviewInviteEmail(slotId, jobId))
          }
        >
          {loading === "invite" ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : null}
          Invite
        </BtnSecondary>
        <BtnSecondary
          type="button"
          className="text-xs py-1.5 px-2.5"
          disabled={loading !== null}
          onClick={() =>
            run("reject", () => draftRejectionEmail(candidateId, jobId))
          }
        >
          {loading === "reject" ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : null}
          Rejection
        </BtnSecondary>
        <BtnSecondary
          type="button"
          className="text-xs py-1.5 px-2.5"
          disabled={loading !== null}
          onClick={() =>
            run("offer", () => draftOfferEmail(candidateId, jobId))
          }
        >
          {loading === "offer" ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : null}
          Offer
        </BtnSecondary>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {text && (
        <pre className="max-h-48 overflow-auto text-xs text-text-secondary whitespace-pre-wrap rounded-lg border border-white/10 bg-surface-2/50 p-3">
          {text}
        </pre>
      )}
    </div>
  );
}
