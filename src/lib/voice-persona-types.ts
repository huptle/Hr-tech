export type CandidatePersona = {
  archetype: string;
  roleTitle: string;
  department: string;
  experienceRange: string;
  budget: {
    fixed: string;
    variable?: string;
    currency: string;
  };
  workMode: "Remote" | "Hybrid" | "On-site" | "Flexible";
  location: string;
  psychologicalDna: string[];
  teamCultureFit: string[];
  dayInTheLife: string[];
  mustHaves: string[];
  greenFlags: string[];
  redFlags: string[];
  suggestedScreeningQuestions: string[];
  summary: string;
  completenessScore: number; // 0 to 100
  status: "gathering" | "ready";
};

export type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
};

export type VoiceTurnResponse = {
  assistantSpeech: string;
  updatedPersona: CandidatePersona;
  detectedLanguage: "en" | "hinglish" | "hi";
  isComplete: boolean;
  suggestedReplies: string[];
};

export const INITIAL_PERSONA: CandidatePersona = {
  archetype: "",
  roleTitle: "",
  department: "",
  experienceRange: "",
  budget: {
    fixed: "",
    variable: "",
    currency: "INR",
  },
  workMode: "Remote",
  location: "",
  psychologicalDna: [],
  teamCultureFit: [],
  dayInTheLife: [],
  mustHaves: [],
  greenFlags: [],
  redFlags: [],
  suggestedScreeningQuestions: [],
  summary: "",
  completenessScore: 0,
  status: "gathering",
};

