import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

const TEST_SECRET = "test_shared_secret_for_partner_auth_2026_xyz";

function base64UrlEncode(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input, "utf-8");
  return buf.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) base64 += "=";
  return Buffer.from(base64, "base64");
}

function createTestToken(payload, secret, alg = "HS256") {
  const header = { alg, typ: "JWT" };
  const hB64 = base64UrlEncode(JSON.stringify(header));
  const pB64 = base64UrlEncode(JSON.stringify(payload));
  const sig = crypto.createHmac("sha256", secret).update(`${hB64}.${pB64}`).digest();
  return `${hB64}.${pB64}.${base64UrlEncode(sig)}`;
}

function verifyTestToken(token, secret) {
  const parts = token.trim().split(".");
  if (parts.length !== 3) throw new Error("Invalid token format");
  const [hB64, pB64, sB64] = parts;
  const header = JSON.parse(base64UrlDecode(hB64).toString("utf-8"));
  if (header.alg !== "HS256") throw new Error("Invalid algorithm");

  const expectedSig = crypto.createHmac("sha256", secret).update(`${hB64}.${pB64}`).digest();
  const actualSig = base64UrlDecode(sB64);
  if (actualSig.length !== expectedSig.length || !crypto.timingSafeEqual(actualSig, expectedSig)) {
    throw new Error("Invalid signature");
  }

  const payload = JSON.parse(base64UrlDecode(pB64).toString("utf-8"));
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && now > payload.exp + 30) throw new Error("Token expired");
  return payload;
}

test("Partner Auth: verifies valid HMAC-SHA256 token", () => {
  const now = Math.floor(Date.now() / 1000);
  const token = createTestToken({
    iss: "mentorlee",
    sub: "usr_123",
    email: "candidate@mentorlee.com",
    name: "Jane Doe",
    iat: now,
    exp: now + 300,
  }, TEST_SECRET);

  const verified = verifyTestToken(token, TEST_SECRET);
  assert.equal(verified.email, "candidate@mentorlee.com");
  assert.equal(verified.sub, "usr_123");
});

test("Partner Auth: rejects forged or tampered signature", () => {
  const now = Math.floor(Date.now() / 1000);
  const token = createTestToken({
    sub: "usr_123",
    email: "candidate@mentorlee.com",
    exp: now + 300,
  }, "different_secret_key");

  assert.throws(() => verifyTestToken(token, TEST_SECRET), /Invalid signature/);
});

test("Partner Auth: rejects expired token", () => {
  const now = Math.floor(Date.now() / 1000);
  const token = createTestToken({
    sub: "usr_123",
    email: "candidate@mentorlee.com",
    exp: now - 3600, // 1 hour in the past
  }, TEST_SECRET);

  assert.throws(() => verifyTestToken(token, TEST_SECRET), /Token expired/);
});
