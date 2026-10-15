import crypto from "crypto";

export type PartnerTokenPayload = {
  iss?: string; // e.g. "mentorlee"
  sub: string; // Unique user ID on partner platform
  email: string; // Candidate email
  name?: string; // Candidate full name
  phone?: string; // Optional phone
  redirect?: string; // Deep link redirect after login (e.g. "/apply/job-id")
  exp: number; // Expiration timestamp (seconds)
  iat?: number; // Issued at timestamp (seconds)
  jti?: string; // Nonce to prevent replay attacks
};

/**
 * Base64URL encode a buffer or string.
 */
function base64UrlEncode(input: Buffer | string): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input, "utf-8");
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

/**
 * Base64URL decode a string to buffer.
 */
function base64UrlDecode(str: string): Buffer {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64");
}

/**
 * Get the partner secret from environment.
 */
export function getPartnerSecret(): string {
  const secret =
    process.env.MENTORLEE_SSO_SECRET?.trim() ||
    process.env.PARTNER_SSO_SECRET?.trim() ||
    process.env.CANDIDATE_SYNC_SECRET?.trim() ||
    "";
  return secret;
}

/**
 * Verify a partner-signed HMAC-SHA256 JWT token.
 * Validates cryptographic signature, expiry, and presence of required fields.
 */
export function verifyPartnerToken(token: string, secretOverride?: string): PartnerTokenPayload {
  const secret = secretOverride || getPartnerSecret();
  if (!secret) {
    throw new Error("Partner SSO is not configured on this server (missing MENTORLEE_SSO_SECRET).");
  }

  const parts = token.trim().split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid token format. Expected header.payload.signature");
  }

  const [headerB64, payloadB64, signatureB64] = parts;

  // 1. Verify Header algorithm
  try {
    const header = JSON.parse(base64UrlDecode(headerB64).toString("utf-8"));
    if (header.alg !== "HS256") {
      throw new Error(`Unsupported token algorithm '${header.alg}'. Only HS256 is supported.`);
    }
  } catch (e) {
    throw new Error(`Invalid token header: ${(e as Error).message}`);
  }

  // 2. Verify Signature with constant-time equality check (prevents timing attacks)
  const dataToSign = `${headerB64}.${payloadB64}`;
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(dataToSign)
    .digest();

  const actualSig = base64UrlDecode(signatureB64);

  if (actualSig.length !== expectedSig.length || !crypto.timingSafeEqual(actualSig, expectedSig)) {
    throw new Error("Invalid cryptographic signature. The token could not be verified.");
  }

  // 3. Parse Payload
  let payload: PartnerTokenPayload;
  try {
    payload = JSON.parse(base64UrlDecode(payloadB64).toString("utf-8"));
  } catch {
    throw new Error("Malformed token payload.");
  }

  // 4. Validate Email
  if (!payload.email || typeof payload.email !== "string" || !payload.email.includes("@")) {
    throw new Error("Token payload must include a valid candidate email.");
  }

  // 5. Validate Expiration
  const now = Math.floor(Date.now() / 1000);
  if (!payload.exp || typeof payload.exp !== "number") {
    throw new Error("Token payload must include an 'exp' expiration timestamp.");
  }

  // Allow 30 seconds of clock skew between partner and Huptle servers
  const CLOCK_SKEW_SEC = 30;
  if (now > payload.exp + CLOCK_SKEW_SEC) {
    throw new Error("Token has expired. Please request a fresh link from the partner portal.");
  }

  // Maximum lifetime check: tokens should not be valid for more than 1 hour to prevent hoarding
  if (payload.iat && payload.exp - payload.iat > 3600) {
    throw new Error("Token lifetime exceeds maximum allowed window (1 hour).");
  }

  return payload;
}

/**
 * Generate a partner token (useful for partner testing and verification).
 */
export function generatePartnerToken(
  payload: Omit<PartnerTokenPayload, "exp" | "iat"> & { expiresInSeconds?: number },
  secretOverride?: string,
): string {
  const secret = secretOverride || getPartnerSecret();
  if (!secret) {
    throw new Error("Missing partner secret for token generation.");
  }

  const now = Math.floor(Date.now() / 1000);
  const ttl = payload.expiresInSeconds || 300; // 5 minutes default

  const header = { alg: "HS256", typ: "JWT" };
  const fullPayload: PartnerTokenPayload = {
    ...payload,
    iat: now,
    exp: now + ttl,
    jti: crypto.randomUUID(),
  };

  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(fullPayload));
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${headerB64}.${payloadB64}`)
    .digest();
  const signatureB64 = base64UrlEncode(signature);

  return `${headerB64}.${payloadB64}.${signatureB64}`;
}
