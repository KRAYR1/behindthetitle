import { z } from "zod";

export const TailorInput = z.object({
  jobText: z.string().min(80).max(12000),
  resumeText: z.string().min(40).max(12000),
  tone: z.enum(["impact", "concise", "technical"]).default("impact"),
});

export const AiSchema = z.object({
  summary: z.string(),
  bullets: z.array(
    z.object({
      original: z.string(),
      rewritten: z.string(),
      rationale: z.string(),
      keywords: z.array(z.string()),
    }),
  ),
  gaps: z.array(z.string()),
});

const TONE_HINT: Record<string, string> = {
  impact: "Lead with measurable outcomes and business impact.",
  concise: "Keep each bullet under 20 words, no filler.",
  technical: "Foreground concrete tools, systems and technical depth.",
};

export function buildSystemPrompt(tone: string) {
  return [
    "You are a hiring-manager-grade resume editor.",
    "Rewrite each of the candidate's existing bullets so it speaks directly to the job posting.",
    "Absolute rule: never invent employers, titles, metrics, or technologies the candidate did not state.",
    "If a bullet cannot be improved truthfully, return it unchanged and say so in the rationale.",
    TONE_HINT[tone] ?? TONE_HINT["impact"],
  ].join(" ");
}

export function buildUserPrompt(jobText: string, originals: string[], missing: string[]) {
  return [
    "JOB POSTING:\n" + jobText,
    "CANDIDATE BULLETS (rewrite each one, keep the same order):\n" +
      originals.map((b, i) => `${i + 1}. ${b}`).join("\n"),
    `KEYWORDS MISSING FROM THE RESUME: ${missing.join(", ") || "none"}`,
    "Return a short summary (max 2 sentences), one rewritten bullet per original with a one-line rationale and the job keywords it now covers, and up to 5 honest gaps the candidate should address or learn.",
  ].join("\n\n");
}
