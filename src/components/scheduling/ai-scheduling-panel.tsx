"use client";

import { useState } from "react";
import { Phone, Loader2, Calendar } from "lucide-react";
import Link from "next/link";
import { startAiSchedulingCalls } from "@/app/actions/scheduling-calls";

type CallableCandidate = {
  id: string;
  name: string;
  phone: string | null;
  phoneE164: string | null;
  rankScore: number | null;
};

export function AiSchedulingPanel({
  jobId,
  candidates,
  vapiReady,
  googleConnected,
}: {
  jobId: string;
  candidates: CallableCandidate[];
  vapiReady: boolean;
  googleConnected: boolean;
}) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(candidates.map((c) => c.id)),
  );
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const canStart = vapiReady && googleConnected && candidates.length > 0;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleStart() {
    setPending(true);
    setMessage(null);
    try {
      const res = await startAiSchedulingCalls(jobId, Array.from(selected));
      setMessage(res.message);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to start calls");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-2xl border border-accent/25 bg-accent/5 overflow-hidden">
      <div className="flex items-center gap-3 border-b border-accent/20 px-6 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15">
          <Phone className="h-4 w-4 text-accent" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-text-primary">AI scheduling calls (India)</h2>
          <p className="text-xs text-text-muted mt-0.5">
            Vapi calls shortlisted candidates (+91), collects availability, books HR slot on your Google Calendar.
          </p>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {!vapiReady && (
          <p className="text-xs text-amber-500 font-medium">
            Configure VAPI_API_KEY, VAPI_PHONE_NUMBER_ID, and VAPI_ASSISTANT_ID on the server.
          </p>
        )}
        {!googleConnected && (
          <p className="text-xs text-amber-500 font-medium">
            <Calendar className="inline h-3.5 w-3.5 mr-1" />
            Connect Google Calendar on{" "}
            <Link href="/profile" className="underline text-accent">
              Profile
            </Link>{" "}
            before starting calls.
          </p>
        )}

        {candidates.length === 0 ? (
          <p className="text-sm text-text-muted">
            No shortlisted candidates with a valid Indian mobile number. Add phone numbers and run screening first.
          </p>
        ) : (
          <ul className="max-h-48 overflow-y-auto divide-y divide-border/30 rounded-xl border border-border/50">
            {candidates.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-2/50">
                <input
                  type="checkbox"
                  checked={selected.has(c.id)}
                  onChange={() => toggle(c.id)}
                  className="rounded border-border accent-accent"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{c.name}</p>
                  <p className="text-xs text-text-muted">{c.phoneE164}</p>
                </div>
                {c.rankScore != null && (
                  <span className="text-xs font-bold text-accent tabular-nums">
                    {Math.round(c.rankScore)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          disabled={!canStart || pending || selected.size === 0}
          onClick={handleStart}
          className="inline-flex items-center gap-2 rounded-xl gradient-bg px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:hover:scale-100 hover:scale-[1.02] transition-all"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />}
          {pending ? "Starting calls…" : `Call ${selected.size} candidate(s)`}
        </button>

        {message && (
          <p className="text-xs font-medium text-text-secondary bg-surface-2 border border-border rounded-xl px-3 py-2">
            {message}
          </p>
        )}
      </div>
    </section>
  );
}
