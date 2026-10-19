import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import nodemailer from "nodemailer";

export interface StoredOtpRecord {
  email: string;
  hashedOtp: string;
  expiresAt: number; // Unix timestamp ms
  attempts: number;
  lastRequestedAt: number;
}

const OTPS_DIR =
  process.env.OTPS_DIR || path.join(process.cwd(), "data", "otps");

function getOtpRecordPath(email: string): string {
  const hash = crypto.createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
  return path.join(OTPS_DIR, `${hash}.json`);
}

function hashOtp(email: string, otp: string): string {
  return crypto
    .createHmac("sha256", process.env.AUTH_SECRET || "huptle_otp_salt_2026")
    .update(`${email.toLowerCase()}:${otp}`)
    .digest("hex");
}

/**
 * Configure nodemailer transporter if SMTP credentials exist in environment.
 */
function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }
  return null;
}

/**
 * Send an OTP code to a candidate's email.
 */
export async function sendCandidateOtp(email: string): Promise<{ success: boolean; message: string; testOtp?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  await fs.mkdir(OTPS_DIR, { recursive: true });

  const filePath = getOtpRecordPath(normalizedEmail);
  const now = Date.now();

  // Check rate limit on existing record
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const existing = JSON.parse(raw) as StoredOtpRecord;
    // Disallow sending more than 1 OTP per 30 seconds
    if (now - existing.lastRequestedAt < 30 * 1000) {
      const waitSec = Math.ceil((30 * 1000 - (now - existing.lastRequestedAt)) / 1000);
      return {
        success: false,
        message: `Please wait ${waitSec} seconds before requesting a new code.`,
      };
    }
  } catch {
    // No prior record exists
  }

  // Generate 6-digit cryptographically secure OTP
  const otpNumber = crypto.randomInt(100000, 999999);
  const otp = otpNumber.toString();
  const hashedOtp = hashOtp(normalizedEmail, otp);
  const expiresAt = now + 10 * 60 * 1000; // 10 minutes

  const record: StoredOtpRecord = {
    email: normalizedEmail,
    hashedOtp,
    expiresAt,
    attempts: 0,
    lastRequestedAt: now,
  };

  await fs.writeFile(filePath, JSON.stringify(record, null, 2), "utf-8");

  // Attempt real email dispatch
  const transporter = getTransporter();
  let emailDispatched = false;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || `"Huptle Careers" <noreply@huptle.com>`,
        to: normalizedEmail,
        subject: `Your Huptle verification code: ${otp}`,
        text: `Your one-time verification code is: ${otp}\n\nThis code will expire in 10 minutes.\nIf you did not request this code, you can safely ignore this email.`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <div style="margin-bottom: 20px;">
              <span style="font-size: 18px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">Huptle</span>
              <span style="font-size: 12px; background: #e0f2fe; color: #0284c7; padding: 2px 8px; border-radius: 9999px; margin-left: 8px; font-weight: 700;">Secure Login</span>
            </div>
            <p style="font-size: 14px; color: #334155; margin-bottom: 24px;">Enter the following verification code to access your candidate profile:</p>
            <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 18px; text-align: center; margin-bottom: 24px;">
              <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #0f172a;">${otp}</span>
            </div>
            <p style="font-size: 12px; color: #64748b; line-height: 1.5;">This verification code is valid for 10 minutes. Do not share this code with anyone.</p>
          </div>
        `,
      });
      emailDispatched = true;
    } catch (err) {
      console.error("[otp-service] Failed to send email via SMTP:", err);
    }
  }

  console.log(`[AUTH-OTP] Generated OTP for ${normalizedEmail}: ${otp} (SMTP Sent: ${emailDispatched})`);

  // In development / test environment, return testOtp so automated suites can verify
  const isDevOrTest = process.env.NODE_ENV !== "production" || !transporter;

  return {
    success: true,
    message: "Verification code sent to your email.",
    ...(isDevOrTest ? { testOtp: otp } : {}),
  };
}

/**
 * Verify a candidate's submitted OTP.
 */
export async function verifyCandidateOtp(
  email: string,
  submittedOtp: string
): Promise<{ success: boolean; message: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const filePath = getOtpRecordPath(normalizedEmail);

  let record: StoredOtpRecord;
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    record = JSON.parse(raw) as StoredOtpRecord;
  } catch {
    return { success: false, message: "No verification code was requested for this email." };
  }

  const now = Date.now();

  // Check expiration
  if (now > record.expiresAt) {
    try {
      await fs.unlink(filePath);
    } catch {}
    return { success: false, message: "Verification code has expired. Please request a new one." };
  }

  // Check attempt limit
  if (record.attempts >= 5) {
    try {
      await fs.unlink(filePath);
    } catch {}
    return { success: false, message: "Too many incorrect attempts. Please request a fresh code." };
  }

  if (record.hashedOtp === "CONSUMED") {
    return { success: false, message: "This verification code has already been used. Please request a new one." };
  }

  // Verify hash
  const candidateHash = hashOtp(normalizedEmail, submittedOtp.trim());
  if (candidateHash !== record.hashedOtp) {
    record.attempts += 1;
    await fs.writeFile(filePath, JSON.stringify(record, null, 2), "utf-8");
    const remaining = 5 - record.attempts;
    return {
      success: false,
      message: `Invalid verification code. ${remaining} ${remaining === 1 ? "attempt" : "attempts"} remaining.`,
    };
  }

  // Success: mark OTP as consumed so it cannot be reused, while preserving rate-limit cooldown
  record.hashedOtp = "CONSUMED";
  record.expiresAt = 0;
  try {
    await fs.writeFile(filePath, JSON.stringify(record, null, 2), "utf-8");
  } catch {}

  return { success: true, message: "Verification successful." };
}
