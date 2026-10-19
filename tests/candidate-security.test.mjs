import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

const AUTH_SECRET = "test_candidate_auth_secret_2026_xyz";

function base64UrlEncode(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input, "utf-8");
  return buf.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) base64 += "=";
  return Buffer.from(base64, "base64");
}

function generateCandidateToken(email, secret = AUTH_SECRET, ttlSec = 30 * 86400) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    sub: email.trim().toLowerCase(),
    email: email.trim().toLowerCase(),
    iat: now,
    exp: now + ttlSec,
    type: "candidate_session",
  };
  const hB64 = base64UrlEncode(JSON.stringify(header));
  const pB64 = base64UrlEncode(JSON.stringify(payload));
  const sig = crypto.createHmac("sha256", secret).update(`${hB64}.${pB64}`).digest();
  return `${hB64}.${pB64}.${base64UrlEncode(sig)}`;
}

function verifyCandidateToken(token, secret = AUTH_SECRET) {
  const parts = token.trim().split(".");
  if (parts.length !== 3) return null;
  const [hB64, pB64, sB64] = parts;
  const expectedSig = crypto.createHmac("sha256", secret).update(`${hB64}.${pB64}`).digest();
  const actualSig = base64UrlDecode(sB64);
  if (actualSig.length !== expectedSig.length || !crypto.timingSafeEqual(actualSig, expectedSig)) {
    return null;
  }
  const payload = JSON.parse(base64UrlDecode(pB64).toString("utf-8"));
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && now > payload.exp) return null;
  return { email: payload.email };
}

test("Candidate Session: signs and verifies valid candidate JWT", () => {
  const email = "candidate_test@example.com";
  const token = generateCandidateToken(email);
  const verified = verifyCandidateToken(token);
  assert.notEqual(verified, null);
  assert.equal(verified?.email, email);
});

test("Candidate Session: rejects tampered token", () => {
  const token = generateCandidateToken("user_a@example.com");
  const [h, p, s] = token.split(".");
  // Modify a character in payload without updating signature
  const modifiedPayload = p.slice(0, -4) + "XyZ=";
  const tampered = `${h}.${modifiedPayload}.${s}`;
  assert.equal(verifyCandidateToken(tampered), null);
});

test("Candidate Session: rejects expired token", () => {
  const token = generateCandidateToken("user_a@example.com", AUTH_SECRET, -100);
  assert.equal(verifyCandidateToken(token), null);
});

test("Path Traversal Protection: rejects malicious filename sequences", () => {
  const isMalicious = (filename) => {
    return !filename || filename.includes("..") || filename.includes("/") || filename.includes("\\");
  };

  assert.equal(isMalicious("../../etc/passwd"), true);
  assert.equal(isMalicious("..\\windows\\system32"), true);
  assert.equal(isMalicious("/absolute/path/file.pdf"), true);
  assert.equal(isMalicious("safe_resume_12345.pdf"), false);
});

test("OTP Hashing: produces deterministic salted SHA-256 HMAC", () => {
  const salt = "huptle_otp_salt_2026";
  const email = "candidate@example.com";
  const otp = "123456";

  const hash1 = crypto.createHmac("sha256", salt).update(`${email.toLowerCase()}:${otp}`).digest("hex");
  const hash2 = crypto.createHmac("sha256", salt).update(`${email.toLowerCase()}:${otp}`).digest("hex");
  const wrongHash = crypto.createHmac("sha256", salt).update(`${email.toLowerCase()}:654321`).digest("hex");

  assert.equal(hash1, hash2);
  assert.notEqual(hash1, wrongHash);
});
