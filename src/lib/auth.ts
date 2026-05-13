import "server-only";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "hr_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

/**
 * Secure cookies are only sent by the browser over HTTPS.
 * If you run the production Docker image on plain http://IP:3000, Secure cookies
 * are never stored/sent → every navigation looks logged out.
 *
 * Order: explicit SESSION_COOKIE_SECURE → x-forwarded-proto → default off when
 * the request is not clearly HTTPS (so IP:port works; put TLS in front for real prod).
 */
async function sessionCookieSecure(): Promise<boolean> {
  const o = process.env.SESSION_COOKIE_SECURE?.toLowerCase();
  if (o === "false" || o === "0" || o === "off") return false;
  if (o === "true" || o === "1" || o === "on") return true;

  const h = await headers();
  const raw = h.get("x-forwarded-proto") ?? h.get("X-Forwarded-Proto") ?? "";
  const proto = raw.split(",")[0]?.trim().toLowerCase();
  if (proto === "https") return true;
  if (proto === "http") return false;

  // Direct hit to Node (no reverse proxy) — typical VPS http://x.x.x.x:3000
  return false;
}

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "AUTH_SECRET is missing or too short. Set AUTH_SECRET (>=16 chars) in your environment.",
    );
  }
  return new TextEncoder().encode(secret);
}

export type SessionPayload = {
  uid: string;
  email: string;
};

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (typeof payload.uid === "string" && typeof payload.email === "string") {
      return { uid: payload.uid, email: payload.email };
    }
    return null;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  const secure = await sessionCookieSecure();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  const secure = await sessionCookieSecure();
  store.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function readSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  designation: string;
  company: string;
  phone: string;
  initials: string;
  isAdmin: boolean;
};

function initialsFor(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await readSession();
  if (!session) return null;
  const user = await prisma.hrUser.findUnique({ where: { id: session.uid } });
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    designation: user.designation,
    company: user.company,
    phone: user.phone,
    initials: initialsFor(user.name),
    isAdmin: user.isAdmin,
  };
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  return user;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export { SESSION_COOKIE };
