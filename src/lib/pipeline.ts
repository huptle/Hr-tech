/** Recruitment pipeline aligned with HR portal → voice screen → rank → schedule → notify */

export const PIPELINE_STEPS: {
  id: string;
  title: string;
  detail: string;
}[] = [
  {
    id: "setup",
    title: "HR portal & inputs",
    detail:
      "Job description, voice agent script, candidate profiles, Google Calendar, and interview slots (e.g., 15 min screening).",
  },
  {
    id: "voice",
    title: "Voice agent screening",
    detail:
      "Cross-check resume, joining availability, ~10 HR questions → feeds AI screening round.",
  },
  {
    id: "rank",
    title: "Rank & shortlist",
    detail:
      "Combine resume + conversation signals; surface best profiles (e.g., top 10).",
  },
  {
    id: "schedule",
    title: "Schedule interview",
    detail:
      "Book slot on calendar; choose HR or AI interview (with cheating / proctoring where needed).",
  },
  {
    id: "notify",
    title: "Email automation",
    detail:
      "Slot booking emails; after selection, send confirmation to the chosen candidate.",
  },
];
