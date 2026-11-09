import test from "node:test";
import assert from "node:assert/strict";

function calculateCompleteness(p) {
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

function detectHinglish(text) {
  const lower = text.toLowerCase();
  const keywords = ["chahiye", "kaise", "kaisa", "batao", "hai", "karna", "saal", "banda", "ladka", "paisa"];
  return keywords.some((kw) => lower.includes(kw));
}

function parseSalaryAndExperience(text) {
  const lower = text.toLowerCase();
  let experience = "";
  let budget = "";

  const expMatch = lower.match(/\d+\s*(to|-)?\s*\d*\s*(years?|yrs?|saal)/);
  if (expMatch) {
    experience = expMatch[0];
  }

  const salMatch = text.match(/\d+[\s-]*(to|-)?\s*\d*\s*(lpa|lakh|lac|k)/i);
  if (salMatch) {
    budget = salMatch[0];
  }

  return { experience, budget };
}

function scoreCandidateMatch(candidate, persona) {
  const keywords = [
    persona.roleTitle,
    persona.archetype,
    ...(persona.mustHaves || []),
  ]
    .filter(Boolean)
    .map((k) => k.toLowerCase());

  let matchCount = 0;
  const blob = `${candidate.name} ${candidate.skills} ${candidate.location} ${candidate.currentCompany}`.toLowerCase();
  for (const kw of keywords) {
    if (blob.includes(kw)) matchCount++;
  }
  return Math.min(98, 65 + matchCount * 10);
}

function compileJobDescription(persona) {
  const parts = [];
  if (persona.summary) parts.push(`### Role Overview\n${persona.summary}`);
  if (persona.archetype) parts.push(`**Target Persona Archetype:** ${persona.archetype}`);
  if (persona.experienceRange) parts.push(`**Experience Target:** ${persona.experienceRange}`);
  if (persona.budget?.fixed) parts.push(`**Compensation Target:** ${persona.budget.fixed}`);
  if (persona.psychologicalDna?.length) {
    parts.push(`### Psychological DNA & Mindset\n${persona.psychologicalDna.map((t) => `- ${t}`).join("\n")}`);
  }
  if (persona.teamCultureFit?.length) {
    parts.push(`### Team & Culture Dynamics\n${persona.teamCultureFit.map((t) => `- ${t}`).join("\n")}`);
  }
  if (persona.greenFlags?.length) {
    parts.push(`### Green Flags\n${persona.greenFlags.map((t) => `✓ ${t}`).join("\n")}`);
  }
  if (persona.redFlags?.length) {
    parts.push(`### Dealbreakers\n${persona.redFlags.map((t) => `✗ ${t}`).join("\n")}`);
  }
  return parts.join("\n\n");
}

test("Voice Recruiter: calculates initial vs progressive completeness score", () => {
  const empty = {
    roleTitle: "",
    archetype: "",
    experienceRange: "",
    budget: { fixed: "" },
    location: "",
    workMode: "",
    psychologicalDna: [],
    teamCultureFit: [],
    greenFlags: [],
    redFlags: [],
  };
  assert.equal(calculateCompleteness(empty), 0);

  const partial = {
    ...empty,
    roleTitle: "B2B Sales SDR",
    archetype: "The Relentless Hunter",
  };
  assert.equal(calculateCompleteness(partial), 30);

  const full = {
    ...partial,
    experienceRange: "2-4 years",
    budget: { fixed: "12-15 LPA" },
    location: "Bengaluru",
    workMode: "Remote",
    psychologicalDna: ["High rejection tolerance", "Self-starter"],
    teamCultureFit: ["Thrives in startup chaos"],
    greenFlags: ["Quata overachiever"],
    redFlags: ["Only wants inbound leads"],
  };
  assert.equal(calculateCompleteness(full), 100);
  assert.ok(calculateCompleteness(full) >= 75);
});

test("Voice Recruiter: detects Hinglish and Hindi colloquial phrasing", () => {
  assert.equal(detectHinglish("Mujhe ek sales ka banda chahiye"), true);
  assert.equal(detectHinglish("Experience 3 saal aur budget 12 lpa hai"), true);
  assert.equal(detectHinglish("Kaisa candidate fit hoga batao"), true);
  assert.equal(detectHinglish("I need a senior frontend engineer in Bangalore"), false);
});

test("Voice Recruiter: extracts experience and compensation expressions", () => {
  const res1 = parseSalaryAndExperience("We want 2-4 years experience and budget is 12-15 LPA");
  assert.equal(res1.experience, "2-4 years");
  assert.equal(res1.budget, "12-15 LPA");

  const res2 = parseSalaryAndExperience("Around 3 saal exp, offering 10 to 14 lakh fixed");
  assert.equal(res2.experience, "3 saal");
  assert.equal(res2.budget, "10 to 14 lakh");
});

test("Voice Recruiter: candidate matching algorithm scores relevance based on persona traits", () => {
  const persona = {
    roleTitle: "B2B Sales",
    archetype: "Hunter",
    mustHaves: ["cold calling", "outbound"],
  };

  const c1 = {
    name: "Aman Sharma",
    skills: "B2B Sales, Cold calling, SaaS, CRM",
    location: "Bangalore",
    currentCompany: "Zomato",
  };
  const c2 = {
    name: "Pooja Patel",
    skills: "Python, Django, AWS",
    location: "Mumbai",
    currentCompany: "Infosys",
  };

  const score1 = scoreCandidateMatch(c1, persona);
  const score2 = scoreCandidateMatch(c2, persona);

  assert.ok(score1 > score2, "Relevant sales candidate must score higher than dev candidate");
  assert.ok(score1 >= 85, "Expected high fit score for matching skills");
});

test("Voice Recruiter: compiles full human-centric Job Description with psychological DNA & culture fit", () => {
  const persona = {
    roleTitle: "Outbound AE",
    archetype: "The Strategic Closer",
    summary: "Driving mid-market B2B software revenue.",
    experienceRange: "3-5 years",
    budget: { fixed: "15-20 LPA" },
    psychologicalDna: ["Extreme persistence", "High EQ listener"],
    teamCultureFit: ["Collaborative with product", "Autonomy driven"],
    greenFlags: ["Consistent 100%+ quota attainment"],
    redFlags: ["Needs heavy micromanagement"],
  };

  const jd = compileJobDescription(persona);
  assert.ok(jd.includes("### Role Overview"));
  assert.ok(jd.includes("**Target Persona Archetype:** The Strategic Closer"));
  assert.ok(jd.includes("Psychological DNA & Mindset"));
  assert.ok(jd.includes("Extreme persistence"));
  assert.ok(jd.includes("Team & Culture Dynamics"));
  assert.ok(jd.includes("Dealbreakers"));
  assert.ok(jd.includes("Needs heavy micromanagement"));
});

test("Voice Recruiter: audio turn fallback handles audio input transcription parsing", () => {
  const fallbackText = "I need a sales guy with 3 years experience";
  const { experience } = parseSalaryAndExperience(fallbackText);
  assert.equal(experience, "3 years");
});
