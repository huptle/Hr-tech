import "server-only";

import { geminiGenerateJson, isGeminiConfigured } from "@/lib/gemini";
import {
  createHrCalendarEvent,
  getHrBusySlots,
  type BusySlot,
} from "@/lib/google-calendar";
import { prisma } from "@/lib/prisma";

export type ParsedAvailability = {
  slots: Array<{
    startIso: string;
    endIso: string;
    label: string;
  }>;
  notes: string;
};

export async function parseAvailabilityFromTranscript(
  transcript: string,
  jobTitle: string,
  candidateName: string,
): Promise<ParsedAvailability> {
  if (!isGeminiConfigured()) {
    return { slots: [], notes: "Gemini not configured; could not parse transcript." };
  }

  const prompt = `You parse phone call transcripts for HR interview scheduling (India Standard Time, Asia/Kolkata).

Job: ${jobTitle}
Candidate: ${candidateName}

Transcript:
${transcript.slice(0, 12000)}

Extract when the candidate is available for a 30-minute HR call in the next 14 days.
Return JSON:
{
  "slots": [
    {
      "startIso": "ISO-8601 datetime with offset +05:30",
      "endIso": "ISO-8601 datetime with offset +05:30 (30 min after start unless they gave a range)",
      "label": "human readable e.g. Tue 3 Apr 2026, 3:00 PM IST"
    }
  ],
  "notes": "short summary"
}
If no clear availability, return empty slots array.`;

  try {
    return await geminiGenerateJson<ParsedAvailability>(prompt);
  } catch {
    return { slots: [], notes: "Failed to parse availability from transcript." };
  }
}

function overlapsBusy(start: Date, end: Date, busy: BusySlot[]): boolean {
  return busy.some((b) => start < b.end && end > b.start);
}

/** Pick first candidate slot that does not overlap HR Google Calendar busy times. */
export function pickBookableSlot(
  parsed: ParsedAvailability,
  busy: BusySlot[],
): { start: Date; end: Date; label: string } | null {
  for (const s of parsed.slots) {
    const start = new Date(s.startIso);
    const end = new Date(s.endIso);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) continue;
    if (end <= start) continue;
    if (start < new Date()) continue;
    if (!overlapsBusy(start, end, busy)) {
      return { start, end, label: s.label };
    }
  }
  return null;
}

export async function bookHrInterviewFromCall(input: {
  jobId: string;
  candidateId: string;
  hrUserId: string;
  parsed: ParsedAvailability;
}): Promise<{ slotId: string | null; message: string }> {
  let busy: BusySlot[] = [];
  try {
    busy = await getHrBusySlots(input.hrUserId, 14);
  } catch {
    /* HR may not have connected Google — still book in app without busy check */
  }

  const chosen = pickBookableSlot(input.parsed, busy);
  if (!chosen) {
    return {
      slotId: null,
      message:
        "Could not match a free slot (check transcript or connect Google Calendar on Profile).",
    };
  }

  const slot = await prisma.interviewSlot.create({
    data: {
      jobId: input.jobId,
      startsAt: chosen.start,
      endsAt: chosen.end,
      mode: "hr",
      candidateId: input.candidateId,
    },
  });

  await prisma.candidate.update({
    where: { id: input.candidateId },
    data: {
      status: "scheduled",
      journey: "Round 1 (HR)",
    },
  });

  const cand = await prisma.candidate.findUnique({
    where: { id: input.candidateId },
    include: { job: true },
  });
  const hr = await prisma.hrUser.findUnique({ where: { id: input.hrUserId } });

  try {
    if (cand && hr) {
      await createHrCalendarEvent({
        userId: input.hrUserId,
        summary: `HR interview: ${cand.name} — ${cand.job.title}`,
        description: `Scheduled via AI scheduling call.\n${chosen.label}\n${input.parsed.notes}`,
        start: chosen.start,
        end: chosen.end,
        attendeeEmail: cand.email,
      });
    }
  } catch {
    /* slot still created in app */
  }

  return {
    slotId: slot.id,
    message: `Booked HR interview: ${chosen.label}`,
  };
}
