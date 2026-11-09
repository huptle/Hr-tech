"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";
import { geminiGenerateJson, isGeminiConfigured } from "@/lib/gemini";
import {
  CandidatePersona,
  ConversationMessage,
  INITIAL_PERSONA,
  VoiceTurnResponse,
} from "@/lib/voice-persona-types";

function calculateCompleteness(p: CandidatePersona): number {
  let score = 0;
  if (p.roleTitle) score += 15;
  if (p.archetype) score += 15;
  if (p.experienceRange) score += 10;
  if (p.budget?.fixed) score += 15;
  if (p.location || p.workMode) score += 10;
  if (p.psychologicalDna && p.psychologicalDna.length > 0) score += 15;
  if (p.teamCultureFit && p.teamCultureFit.length > 0) score += 10;
  if (p.greenFlags && p.greenFlags.length > 0) score += 5;
  if (p.redFlags && p.redFlags.length > 0) score += 5;
  return Math.min(100, score);
}

function mockVoiceTurnResponse(
  userMessage: string,
  currentPersona: CandidatePersona,
): VoiceTurnResponse {
  const lower = userMessage.toLowerCase();
  const updated: CandidatePersona = {
    ...currentPersona,
    budget: { ...currentPersona.budget },
    psychologicalDna: [...currentPersona.psychologicalDna],
    teamCultureFit: [...currentPersona.teamCultureFit],
    dayInTheLife: [...currentPersona.dayInTheLife],
    mustHaves: [...currentPersona.mustHaves],
    greenFlags: [...currentPersona.greenFlags],
    redFlags: [...currentPersona.redFlags],
    suggestedScreeningQuestions: [...currentPersona.suggestedScreeningQuestions],
  };

  let assistantSpeech = "";
  const isHinglish =
    lower.includes("chahiye") ||
    lower.includes("kaise") ||
    lower.includes("kaisa") ||
    lower.includes("batao") ||
    lower.includes("hai") ||
    lower.includes("karna");

  if (!updated.roleTitle) {
    if (lower.includes("sale") || lower.includes("sdr") || lower.includes("bd")) {
      updated.roleTitle = "B2B Inside Sales Representative / SDR";
      updated.archetype = "The Relentless Hunter";
      updated.department = "Sales";
      updated.mustHaves = ["Outbound prospecting", "Cold calling", "CRM pipeline hygiene"];
      updated.dayInTheLife = [
        "50+ outbound dials/day to qualified leads",
        "Conducting discovery calls & qualifying prospects",
        "Booking demos for Account Executives",
      ];
      assistantSpeech = isHinglish
        ? "Samajh gaya! B2B Sales ke liye ek proactive Hunter archetype sahi rahega. Candidate ka experience level kitna expect kar rahe hain, aur budget (CTC) kitna socha hai?"
        : "Got it! For B2B Sales, a proactive 'Hunter' archetype will be ideal. What experience level (years) and budget (CTC range) do you have in mind?";
    } else if (lower.includes("engineer") || lower.includes("dev") || lower.includes("tech")) {
      updated.roleTitle = "Full-Stack Software Engineer";
      updated.archetype = "The Product-Minded Builder";
      updated.department = "Engineering";
      updated.mustHaves = ["TypeScript", "Next.js", "Node.js", "PostgreSQL"];
      assistantSpeech = isHinglish
        ? "Badiya! Ek strong Engineering persona build karte hain. Experience level (e.g. 2-4 yrs ya senior) aur CTC budget kya rahega?"
        : "Great! Let's build a solid Engineering persona. What experience level and CTC budget are you targeting?";
    } else {
      updated.roleTitle = userMessage.trim().slice(0, 40);
      updated.archetype = "Core Team Contributor";
      assistantSpeech = isHinglish
        ? `Samajh gaya! ${updated.roleTitle} role ke liye, experience expectations aur budget range kya socha hai aapne?`
        : `Understood! For ${updated.roleTitle}, what experience level and budget range do you have in mind?`;
    }
  } else if (!updated.experienceRange || !updated.budget.fixed) {
    if (lower.match(/\d+\s*(to|-)?\s*\d*\s*(yr|year|saal)/)) {
      const match = lower.match(/\d+\s*(to|-)?\s*\d*\s*(yr|year|saal)/)?.[0];
      if (match) updated.experienceRange = match;
    } else {
      updated.experienceRange = "2 - 5 Years";
    }

    if (lower.includes("lpa") || lower.includes("lakh") || lower.includes("k") || lower.includes("lac")) {
      updated.budget.fixed = userMessage.match(/\d+[\s-]*(to|-)?\s*\d*\s*(lpa|lakh|lac|k)/i)?.[0] || "10 - 15 LPA";
    } else {
      updated.budget.fixed = "12 - 16 LPA";
    }

    assistantSpeech = isHinglish
      ? "Perfect! Ab team culture aur mindset ki baat karte hain — kaisa human chahiye team me? Kya aggressively self-driven closer chahiye, ya methodical relationship builder? Aur koi dealbreakers/red flags?"
      : "Perfect! Now let's talk culture and DNA — what kind of human fits your team best? A hungry self-starter closer or a methodical relationship builder? Any dealbreakers?";
  } else {
    // Cultural and personality fit
    if (!updated.psychologicalDna.length) {
      updated.psychologicalDna = [
        "High rejection tolerance & extreme resilience",
        "Autonomous self-starter; minimal supervision needed",
        "Clear, confident consultative communicator",
      ];
      updated.teamCultureFit = [
        "Thrives in fast-moving startup environment",
        "Takes ownership of outcomes rather than excuses",
        "Receptive to coaching and rapid feedback",
      ];
      updated.greenFlags = [
        "Track record of beating outbound targets",
        "Has cold-called and handled objections proactively",
      ];
      updated.redFlags = [
        "Expects pure inbound spoon-fed leads",
        "Easily discouraged by rejection in the first 2 weeks",
      ];
      updated.suggestedScreeningQuestions = [
        "Tell me about a time you missed your quota or had a rough sales week. How did you turn it around?",
        "Walk me through your cold outbound prospecting sequence from Day 1 to Day 14.",
        "How do you handle a prospect who tells you your pricing is double their budget?",
        "What work environment or management style helps you perform at your absolute best?",
      ];
      updated.summary = `${updated.roleTitle} (${updated.archetype}) tailored for high-growth, high-accountability teams.`;
      updated.status = "ready";
      assistantSpeech = isHinglish
        ? "Zabardast! Aapka Ideal Candidate Persona pura ready hai. Maine mindset traits, green flags, red flags aur screening questions sab plan kar diye hain. Kya main iska Live Job create kar doon?"
        : "Awesome! Your Ideal Candidate Persona is fully formed with cultural DNA, green flags, dealbreakers, and voice screening questions. Would you like me to create the live job posting now?";
    }
  }

  updated.completenessScore = calculateCompleteness(updated);
  if (updated.completenessScore >= 75) {
    updated.status = "ready";
  }

  return {
    assistantSpeech,
    updatedPersona: updated,
    detectedLanguage: isHinglish ? "hinglish" : "en",
    isComplete: updated.status === "ready",
    suggestedReplies:
      updated.status === "ready"
        ? ["Create Live Job", "Search Talent Pool", "Adjust Budget"]
        : ["2-4 Years experience", "10-15 LPA budget", "Hungry self-starter closer"],
  };
}

export async function processVoiceTurn(
  userMessage: string,
  conversationHistory: ConversationMessage[],
  currentPersona: CandidatePersona = INITIAL_PERSONA,
): Promise<VoiceTurnResponse> {
  const messageTrimmed = userMessage.trim();
  if (!messageTrimmed) {
    return {
      assistantSpeech: "Sun raha hoon! Aap bataiye kaisa candidate dhundna hai?",
      updatedPersona: currentPersona,
      detectedLanguage: "hinglish",
      isComplete: currentPersona.status === "ready",
      suggestedReplies: [
        "I need a B2B sales guy",
        "Full-stack engineer chahiye",
        "Hiring a Product Designer",
      ],
    };
  }

  if (!isGeminiConfigured()) {
    return mockVoiceTurnResponse(messageTrimmed, currentPersona);
  }

  const prompt = `You are "Huptle Voice Recruiter", an elite AI executive talent scout embedded in Huptle HR Tech platform.
You are talking in voice mode with an HR Manager or Hiring Founder.

USER MESSAGE: "${messageTrimmed}"

CONVERSATION HISTORY:
${conversationHistory
  .slice(-6)
  .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
  .join("\n")}

CURRENT PERSONA STATE (JSON):
${JSON.stringify(currentPersona, null, 2)}

INSTRUCTIONS & CONVERSATION GUIDELINES:
1. LANGUAGE: Support natural English, Hindi, and natural Hinglish. If the user speaks Hinglish or Hindi, reply in smooth, natural, professional Hinglish (e.g. "Bilkul! 2-4 saal ke experience me cold outbound chahiye ya client relationship closer? Aur budget kya socha hai aapne?").
2. CONVERSATIONAL VOICE PACING: This is a spoken voice dialogue. Keep your response spoken-friendly (2-3 sentences max). Ask only 1 or 2 focused questions at a time. Do not dump bullet points in the spoken text.
3. PERSONA BUILDING FOCUS ("Ki kaisa human chahiye team me"):
   - Extract role title, archetype (e.g. "The Scrappy SaaS Hunter", "The Analytical Problem Solver").
   - Experience range, budget (fixed + variable).
   - Psychological DNA (mindset, resilience, autonomy, drive).
   - Team culture fit (startup speed, structured vs unstructured, manager dynamics).
   - Must-haves, Green flags (signs of an A-player), Red flags (dealbreakers).
   - 4-6 sharp voice screening questions.
4. COMPLETENESS & READINESS:
   - Calculate completenessScore (0-100).
   - When completenessScore >= 75 and key facets (role, budget/experience, mindset/culture) are gathered, mark status as "ready".
   - If ready, invite the user to create the job posting or match candidate profiles.

Respond with ONLY valid JSON adhering strictly to this schema:
{
  "assistantSpeech": "The exact spoken text you will say back to the user (concise, conversational, Hinglish/English)",
  "detectedLanguage": "en" | "hinglish" | "hi",
  "isComplete": boolean,
  "suggestedReplies": string[] (2-3 short chips the user can tap if not speaking),
  "updatedPersona": {
    "archetype": string,
    "roleTitle": string,
    "department": string,
    "experienceRange": string,
    "budget": {
      "fixed": string,
      "variable": string,
      "currency": string
    },
    "workMode": "Remote" | "Hybrid" | "On-site" | "Flexible",
    "location": string,
    "psychologicalDna": string[],
    "teamCultureFit": string[],
    "dayInTheLife": string[],
    "mustHaves": string[],
    "greenFlags": string[],
    "redFlags": string[],
    "suggestedScreeningQuestions": string[],
    "summary": string,
    "completenessScore": number,
    "status": "gathering" | "ready"
  }
}`;

  try {
    const res = await geminiGenerateJson<VoiceTurnResponse>(prompt);
    if (!res.updatedPersona) {
      res.updatedPersona = currentPersona;
    }
    res.updatedPersona.completenessScore = calculateCompleteness(res.updatedPersona);
    if (res.updatedPersona.completenessScore >= 75) {
      res.updatedPersona.status = "ready";
      res.isComplete = true;
    }
    return res;
  } catch (err) {
    console.error("Gemini voice recruiter error, using fallback:", err);
    return mockVoiceTurnResponse(messageTrimmed, currentPersona);
  }
}

export async function createJobFromPersona(persona: CandidatePersona) {
  const user = await requireUser();

  const title = persona.roleTitle || persona.archetype || "New Strategic Role";
  const dept = persona.department || "General";
  const location = persona.location || "Remote, India";
  const mode = persona.workMode || "Remote";

  const descriptionParts: string[] = [];
  if (persona.summary) {
    descriptionParts.push(`### Role Overview\n${persona.summary}\n`);
  }
  if (persona.archetype) {
    descriptionParts.push(`**Target Persona Archetype:** ${persona.archetype}`);
  }
  if (persona.experienceRange) {
    descriptionParts.push(`**Experience Target:** ${persona.experienceRange}`);
  }
  if (persona.budget?.fixed) {
    descriptionParts.push(
      `**Compensation Target:** ${persona.budget.fixed} ${persona.budget.variable ? `(+ ${persona.budget.variable})` : ""}`,
    );
  }
  if (persona.psychologicalDna?.length) {
    descriptionParts.push(
      `\n### Psychological DNA & Mindset\n${persona.psychologicalDna.map((t) => `- ${t}`).join("\n")}`,
    );
  }
  if (persona.teamCultureFit?.length) {
    descriptionParts.push(
      `\n### Team & Culture Dynamics\n${persona.teamCultureFit.map((t) => `- ${t}`).join("\n")}`,
    );
  }
  if (persona.dayInTheLife?.length) {
    descriptionParts.push(
      `\n### Day-in-the-Life Responsibilities\n${persona.dayInTheLife.map((t) => `- ${t}`).join("\n")}`,
    );
  }
  if (persona.greenFlags?.length) {
    descriptionParts.push(
      `\n### Green Flags (Signals to Hire)\n${persona.greenFlags.map((t) => `✓ ${t}`).join("\n")}`,
    );
  }
  if (persona.redFlags?.length) {
    descriptionParts.push(
      `\n### Dealbreakers & Red Flags\n${persona.redFlags.map((t) => `✗ ${t}`).join("\n")}`,
    );
  }

  const fullDescription = descriptionParts.join("\n\n");

  const questionsToCreate =
    persona.suggestedScreeningQuestions && persona.suggestedScreeningQuestions.length >= 3
      ? persona.suggestedScreeningQuestions
      : [
          `Can you walk us through your most relevant experience for this ${title} role?`,
          "What working environment or management style helps you perform at your best?",
          "Tell me about a difficult obstacle you faced in your previous role and how you overcame it.",
          "What are your fixed and variable compensation expectations?",
        ];

  const job = await prisma.job.create({
    data: {
      title,
      description: fullDescription,
      dept,
      location,
      mode,
      status: "Live",
      createdById: user.id,
      questions: {
        create: questionsToCreate.map((text, order) => ({
          order,
          text: text.trim(),
        })),
      },
    },
  });

  await logActivity({
    tag: "job",
    what: `Created live job "${title}" with AI Persona Archetype "${persona.archetype || "Standard"}" via Voice Recruiter`,
    actorId: user.id,
    jobId: job.id,
  });

  revalidatePath("/jobs");
  revalidatePath("/");

  return {
    ok: true,
    jobId: job.id,
    title: job.title,
  };
}

export async function searchTalentPoolForPersona(persona: CandidatePersona) {
  await requireUser();

  const keywords = [
    persona.roleTitle,
    persona.archetype,
    ...(persona.mustHaves || []),
  ]
    .filter(Boolean)
    .map((k) => k.toLowerCase());

  // Search Broker candidates
  const brokerCandidates = await prisma.brokerCandidate.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      skills: true,
      experienceYears: true,
      expectedSalary: true,
      location: true,
      currentCompany: true,
      broker: {
        select: {
          agencyName: true,
          brokerCode: true,
        },
      },
    },
  });

  // Score candidate relevance
  const scored = brokerCandidates.map((c) => {
    let matchCount = 0;
    const blob = `${c.name} ${c.skills} ${c.location} ${c.currentCompany}`.toLowerCase();
    for (const kw of keywords) {
      if (blob.includes(kw)) matchCount++;
    }
    const score = Math.min(98, 65 + matchCount * 10);
    return {
      ...c,
      matchScore: score,
    };
  });

  scored.sort((a, b) => b.matchScore - a.matchScore);

  return {
    candidates: scored.slice(0, 5),
  };
}
