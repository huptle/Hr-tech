import crypto from "crypto";

export interface CandidateTokenPayload {
  sub: string; // Candidate email
  email: string;
  iat: number;
  exp: number;
  type: "candidate_session";
}

function base64UrlEncode(input: Buffer | string): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input, "utf-8");
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(str: string): Buffer {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64");
}

function getAuthSecret(): string {
  return (
    process.env.AUTH_SECRET?.trim() ||
    process.env.CANDIDATE_SYNC_SECRET?.trim() ||
    process.env.MENTORLEE_SSO_SECRET?.trim() ||
    "huptle_candidate_auth_secret_dev_2026"
  );
}

/**
 * Generate a signed candidate session JWT (30-day validity).
 */
export function generateCandidateToken(email: string): string {
  const secret = getAuthSecret();
  const normalizedEmail = email.trim().toLowerCase();
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 30 * 24 * 60 * 60; // 30 days

  const header = { alg: "HS256", typ: "JWT" };
  const payload: CandidateTokenPayload = {
    sub: normalizedEmail,
    email: normalizedEmail,
    iat: now,
    exp,
    type: "candidate_session",
  };

  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const dataToSign = `${headerB64}.${payloadB64}`;

  const sig = crypto.createHmac("sha256", secret).update(dataToSign).digest();
  const sigB64 = base64UrlEncode(sig);

  return `${headerB64}.${payloadB64}.${sigB64}`;
}

/**
 * Verify a candidate session JWT.
 */
export function verifyCandidateToken(token: string): { email: string } | null {
  try {
    const parts = token.trim().split(".");
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, sigB64] = parts;
    const secret = getAuthSecret();

    // Constant-time signature verification
    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(`${headerB64}.${payloadB64}`)
      .digest();
    const actualSig = base64UrlDecode(sigB64);

    if (actualSig.length !== expectedSig.length || !crypto.timingSafeEqual(actualSig, expectedSig)) {
      return null;
    }

    const payload = JSON.parse(base64UrlDecode(payloadB64).toString("utf-8")) as CandidateTokenPayload;
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && now > payload.exp) {
      return null;
    }

    if (!payload.email || typeof payload.email !== "string") {
      return null;
    }

    return { email: payload.email.trim().toLowerCase() };
  } catch {
    return null;
  }
}

/**
 * Extract authenticated candidate email from incoming request (cookies, headers, internal secrets).
 */
export function getAuthenticatedCandidateEmail(req: Request): string | null {
  // 1. Check internal server sync key (for HR Portal to sync candidate data)
  const internalSecret = req.headers.get("x-internal-secret")?.trim() || req.headers.get("x-partner-key")?.trim();
  const expectedSecret = process.env.CANDIDATE_SYNC_SECRET?.trim() || process.env.AUTH_SECRET?.trim();
  if (internalSecret && expectedSecret && internalSecret === expectedSecret) {
    const url = new URL(req.url);
    const queryEmail = url.searchParams.get("email")?.trim().toLowerCase();
    if (queryEmail) return queryEmail;
  }

  // 2. Check Authorization Bearer header
  const authHeader = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "")?.trim();
  if (authHeader) {
    const verified = verifyCandidateToken(authHeader);
    if (verified) return verified.email;
  }

  // 3. Check Cookie headers
  const cookieHeader = req.headers.get("cookie") || "";
  const cookies = parseCookies(cookieHeader);

  // 3a. Check huptle_candidate_session cookie
  const sessionToken = cookies["huptle_candidate_session"];
  if (sessionToken) {
    const verified = verifyCandidateToken(sessionToken);
    if (verified) return verified.email;
  }

  // 3b. Check huptle_partner_session (Mentorlee SSO)
  const partnerSessionRaw = cookies["huptle_partner_session"];
  if (partnerSessionRaw) {
    try {
      const decoded = decodeURIComponent(partnerSessionRaw);
      const parsed = JSON.parse(decoded);
      if (parsed.email && typeof parsed.email === "string") {
        return parsed.email.trim().toLowerCase();
      }
    } catch {
      // Ignore malformed partner cookie
    }
  }

  return null;
}

function parseCookies(cookieStr: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieStr) return result;

  const pairs = cookieStr.split(";");
  for (const pair of pairs) {
    const [name, ...valParts] = pair.split("=");
    if (name) {
      result[name.trim()] = valParts.join("=").trim();
    }
  }
  return result;
}
