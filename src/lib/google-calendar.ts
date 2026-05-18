import "server-only";

import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events",
];

export function isGoogleCalendarConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() &&
      process.env.GOOGLE_CLIENT_SECRET?.trim(),
  );
}

function redirectUri(): string {
  const explicit = process.env.GOOGLE_REDIRECT_URI?.trim();
  if (explicit) return explicit;
  const base = process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/api/auth/google/callback`;
}

export function getGoogleOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required.");
  }
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri());
}

export function getGoogleAuthUrl(state: string): string {
  const client = getGoogleOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    state,
  });
}

export async function exchangeGoogleCode(code: string) {
  const client = getGoogleOAuthClient();
  const { tokens } = await client.getToken(code);
  return tokens;
}

export async function saveGoogleTokensForUser(
  userId: string,
  tokens: {
    access_token?: string | null;
    refresh_token?: string | null;
    expiry_date?: number | null;
  },
) {
  const existing = await prisma.hrUser.findUnique({ where: { id: userId } });
  await prisma.hrUser.update({
    where: { id: userId },
    data: {
      googleAccessToken: tokens.access_token || existing?.googleAccessToken || "",
      googleRefreshToken:
        tokens.refresh_token || existing?.googleRefreshToken || "",
      googleTokenExpiry: tokens.expiry_date
        ? new Date(tokens.expiry_date)
        : null,
    },
  });
}

export async function getCalendarClientForUser(userId: string) {
  const user = await prisma.hrUser.findUnique({ where: { id: userId } });
  if (!user?.googleRefreshToken && !user?.googleAccessToken) {
    throw new Error("Google Calendar is not connected for this HR user.");
  }

  const client = getGoogleOAuthClient();
  client.setCredentials({
    access_token: user.googleAccessToken || undefined,
    refresh_token: user.googleRefreshToken || undefined,
    expiry_date: user.googleTokenExpiry?.getTime(),
  });

  client.on("tokens", async (tokens) => {
    await saveGoogleTokensForUser(userId, tokens);
  });

  return google.calendar({ version: "v3", auth: client });
}

export type BusySlot = { start: Date; end: Date };

/** Free/busy for primary calendar (next `days` days, IST-oriented window). */
export async function getHrBusySlots(
  userId: string,
  days = 7,
): Promise<BusySlot[]> {
  const calendar = await getCalendarClientForUser(userId);
  const timeMin = new Date();
  const timeMax = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  const res = await calendar.freebusy.query({
    requestBody: {
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      timeZone: "Asia/Kolkata",
      items: [{ id: "primary" }],
    },
  });

  const busy = res.data.calendars?.primary?.busy ?? [];
  return busy
    .filter((b) => b.start && b.end)
    .map((b) => ({
      start: new Date(b.start!),
      end: new Date(b.end!),
    }));
}

export async function createHrCalendarEvent(input: {
  userId: string;
  summary: string;
  description: string;
  start: Date;
  end: Date;
  attendeeEmail?: string;
}) {
  const calendar = await getCalendarClientForUser(input.userId);
  const res = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: input.summary,
      description: input.description,
      start: { dateTime: input.start.toISOString(), timeZone: "Asia/Kolkata" },
      end: { dateTime: input.end.toISOString(), timeZone: "Asia/Kolkata" },
      attendees: input.attendeeEmail
        ? [{ email: input.attendeeEmail }]
        : undefined,
    },
  });
  return res.data.id;
}

export function isHrGoogleConnected(user: {
  googleRefreshToken: string;
  googleAccessToken: string;
}): boolean {
  return Boolean(user.googleRefreshToken || user.googleAccessToken);
}
