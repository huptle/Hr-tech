import test from "node:test";
import assert from "node:assert/strict";

function generateBrokerCode(randomSuffix = Math.floor(1000 + Math.random() * 9000)) {
  return `BRK-${randomSuffix}`;
}

function calculateCommission(job, annualSalary = 0) {
  if (job.commissionType === "percentage") {
    return Math.round((job.commissionAmount / 100) * annualSalary);
  }
  return job.commissionAmount || 20000;
}

function validateCandidateSubmission({ candidateEmail, existingApplications, consentConfirmed }) {
  if (!consentConfirmed) {
    return { ok: false, error: "Candidate consent must be confirmed before submitting." };
  }
  const isDuplicate = existingApplications.some(
    (app) => app.email.toLowerCase() === candidateEmail.toLowerCase()
  );
  if (isDuplicate) {
    return { ok: false, error: "Duplicate Submission Blocked: Candidate has already applied for this job." };
  }
  return { ok: true };
}

function transitionCommissionStatus(currentStatus, action, transactionRef = "") {
  if (action === "APPROVE") {
    if (currentStatus !== "Pending") {
      throw new Error("Only Pending commissions can be Approved.");
    }
    return { status: "Approved" };
  }
  if (action === "PAY") {
    if (currentStatus !== "Approved") {
      throw new Error("Only Approved commissions can be marked as Paid.");
    }
    if (!transactionRef || !transactionRef.trim()) {
      throw new Error("Payment reference ID is required.");
    }
    return { status: "Paid", transactionRef: transactionRef.trim() };
  }
  if (action === "REVERSE") {
    if (currentStatus === "Paid") {
      throw new Error("Paid commissions cannot be reversed directly.");
    }
    return { status: "Reversed" };
  }
  throw new Error(`Unknown action: ${action}`);
}

test("Broker ID: generates valid BRK-XXXX code format", () => {
  const code = generateBrokerCode(7842);
  assert.equal(code, "BRK-7842");
  assert.match(code, /^BRK-\d{4}$/);
});

test("Commission Calculation: computes fixed and percentage payouts correctly", () => {
  const fixedJob = { commissionType: "fixed", commissionAmount: 25000 };
  const fixedPayout = calculateCommission(fixedJob);
  assert.equal(fixedPayout, 25000);

  const percentJob = { commissionType: "percentage", commissionAmount: 8.33 }; // 8.33% = 1 month CTC
  const percentPayout = calculateCommission(percentJob, 1200000); // 12 LPA
  assert.equal(percentPayout, 99960);
});

test("Duplicate Protection: blocks candidate if already submitted for same job", () => {
  const existing = [{ email: "candidate@talent.com" }];

  const duplicateResult = validateCandidateSubmission({
    candidateEmail: "CANDIDATE@talent.com",
    existingApplications: existing,
    consentConfirmed: true,
  });
  assert.equal(duplicateResult.ok, false);
  assert.match(duplicateResult.error, /Duplicate Submission Blocked/);

  const newResult = validateCandidateSubmission({
    candidateEmail: "new_person@talent.com",
    existingApplications: existing,
    consentConfirmed: true,
  });
  assert.equal(newResult.ok, true);
});

test("Consent Enforcement: rejects submissions without explicit candidate authorization", () => {
  const result = validateCandidateSubmission({
    candidateEmail: "candidate@talent.com",
    existingApplications: [],
    consentConfirmed: false,
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /Candidate consent must be confirmed/);
});

test("Commission State Machine: transitions Pending -> Approved -> Paid with Ref", () => {
  const initial = { status: "Pending" };
  const approved = transitionCommissionStatus(initial.status, "APPROVE");
  assert.equal(approved.status, "Approved");

  // Attempt to pay without transaction ref should fail
  assert.throws(() => {
    transitionCommissionStatus(approved.status, "PAY", "");
  }, /Payment reference ID is required/);

  // Pay with valid transaction reference
  const paid = transitionCommissionStatus(approved.status, "PAY", "UPI-HDFC-9918237");
  assert.equal(paid.status, "Paid");
  assert.equal(paid.transactionRef, "UPI-HDFC-9918237");
});

test("Commission State Machine: allows reversing Pending commissions", () => {
  const reversed = transitionCommissionStatus("Pending", "REVERSE");
  assert.equal(reversed.status, "Reversed");
});
