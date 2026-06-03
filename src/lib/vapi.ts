import "server-only";

import { normalizeIndianPhone } from "@/lib/phone";

const VAPI_API = "https://api.vapi.ai";

export function isVapiConfigured(): boolean {
  return Boolean(
    process.env.VAPI_API_KEY?.trim() &&
      process.env.VAPI_PHONE_NUMBER_ID?.trim() &&
      (process.env.VAPI_ASSISTANT_ID?.trim() ||
        process.env.GEMINI_API_KEY?.trim()),
  );
}

export type VapiOutboundInput = {
  customerNumber: string;
  candidateName: string;
  jobTitle: string;
  companyName: string;
  hrName: string;
};

export type VapiOutboundResult = {
  callId: string;
};

function buildSchedulingAssistantPrompt(input: VapiOutboundInput): string {
  return [
    `You are a polite scheduling assistant calling on behalf of ${input.companyName || "the company"} HR team.`,
    `You are speaking with ${input.candidateName} about the role: ${input.jobTitle}.`,
    `HR contact: ${input.hrName}.`,
    "",
    "Goals:",
    "1. Confirm you reached the right person for this job application.",
    "2. Ask which dates and times in the next 7 days work for a 30-minute HR discussion call (India Standard Time).",
    "3. Ask for a specific window (e.g. Tuesday 3pm–4pm IST) — at least one option.",
    "4. Confirm their phone number is correct for a callback if needed.",
    "",
    "Rules:",
    "- Speak in clear English; switch to Hindi only if the candidate prefers.",
    "- Keep the call under 3 minutes.",
    "- Do not discuss salary or make job offers.",
    "- If they decline, thank them and end politely.",
    "- At the end, repeat back the time slot they chose in IST.",
  ].join("\n");
}

export async function createVapiSchedulingCall(
  input: VapiOutboundInput,
): Promise<VapiOutboundResult> {
  const apiKey = process.env.VAPI_API_KEY?.trim();
  const phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID?.trim();
  if (!apiKey || !phoneNumberId) {
    throw new Error("VAPI_API_KEY and VAPI_PHONE_NUMBER_ID must be set.");
  }

  const e164 = normalizeIndianPhone(input.customerNumber);
  if (!e164) {
    throw new Error("Invalid Indian phone number (+91, 10 digits, starts 6–9).");
  }

  const assistantId = process.env.VAPI_ASSISTANT_ID?.trim();
  const body: Record<string, unknown> = {
    phoneNumberId,
    customer: { number: e164, name: input.candidateName },
  };

  if (assistantId) {
    body.assistantId = assistantId;
  } else {
    body.assistant = {
      name: "Huptle HR Scheduler",
      firstMessage: `Hello ${input.candidateName}, this is an automated call from ${input.companyName || "our HR team"} regarding your application for ${input.jobTitle}. Do you have two minutes to schedule a short HR discussion call?`,
      model: {
        provider: "google",
        model: process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: buildSchedulingAssistantPrompt(input),
          },
        ],
      },
    };
  }

  const res = await fetch(`${VAPI_API}/call`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Vapi error ${res.status}: ${text.slice(0, 500)}`);
  }

  const data = JSON.parse(text) as { id?: string };
  if (!data.id) throw new Error("Vapi did not return a call id.");
  return { callId: data.id };
}
