import "server-only";

import { prisma } from "@/lib/prisma";

export type ActivityTag = "new" | "hired" | "rejected" | "interview" | "job" | "template";

export async function logActivity(input: {
  tag: ActivityTag;
  what: string;
  actorId?: string | null;
  candidateId?: string | null;
  jobId?: string | null;
}): Promise<void> {
  try {
    await prisma.activity.create({
      data: {
        tag: input.tag,
        what: input.what,
        actorId: input.actorId ?? null,
        candidateId: input.candidateId ?? null,
        jobId: input.jobId ?? null,
      },
    });
  } catch {
    // Activity logging is non-fatal — never break the calling action because of it.
  }
}

export function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const sec = Math.max(1, Math.floor(diff / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}
