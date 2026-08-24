import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  computeMatch,
  fallbackTailor,
  splitBullets,
  type TailorResult,
} from "./tailor";

const TailorInput = z.object({
  jobText: z.string().min(80).max(12000),
  resumeText: z.string().min(40).max(12000),
  tone: z.enum(["impact", "concise", "technical"]).default("impact"),
});

const AiSchema = z.object({
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

export const tailorApplication = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => TailorInput.parse(input))
  .handler(async ({ data }): Promise<TailorResult> => {
    const { jobText, resumeText, tone } = data;
    const match = computeMatch(jobText, resumeText);
    const originals = splitBullets(resumeText).slice(0, 8);

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return fallbackTailor(jobText, resumeText);

    const { generateText, Output } = await import("ai");
    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(apiKey);

    const system = [
      "You are a hiring-manager-grade resume editor.",
      "Rewrite each of the candidate's existing bullets so it speaks directly to the job posting.",
      "Absolute rule: never invent employers, titles, metrics, or technologies the candidate did not state.",
      "If a bullet cannot be improved truthfully, return it unchanged and say so in the rationale.",
      TONE_HINT[tone],
    ].join(" ");

    const prompt = [
      "JOB POSTING:\n" + jobText,
      "CANDIDATE BULLETS (rewrite each one, keep the same order):\n" +
        originals.map((b, i) => `${i + 1}. ${b}`).join("\n"),
      `KEYWORDS MISSING FROM THE RESUME: ${match.missing.join(", ") || "none"}`,
      "Return a short summary (max 2 sentences), one rewritten bullet per original with a one-line rationale and the job keywords it now covers, and up to 5 honest gaps the candidate should address or learn.",
    ].join("\n\n");

    try {
      const { output } = await generateText({
        model: gateway("google/gemini-3.7-flash"),
        output: Output.object({ schema: AiSchema }),
        system,
        prompt,
      });

      const bullets = output.bullets
        .filter((b) => b.rewritten.trim().length > 0)
        .map((b, i) => ({
          original: b.original?.trim() || originals[i] || "",
          rewritten: b.rewritten.trim(),
          rationale: b.rationale?.trim() || "Aligned with the posting.",
          keywords: (b.keywords ?? []).slice(0, 5),
        }));

      if (bullets.length === 0) return fallbackTailor(jobText, resumeText);

      const rewrittenMatch = computeMatch(
        jobText,
        bullets.map((b) => b.rewritten).join("\n"),
      );

      return {
        match: rewrittenMatch.score >= match.score ? rewrittenMatch : match,
        summary: output.summary.trim(),
        bullets,
        gaps: output.gaps.slice(0, 5),
        source: "ai",
      };
    } catch (error) {
      const status = (error as { statusCode?: number; status?: number })?.statusCode ??
        (error as { status?: number })?.status;
      if (status === 429)
        throw new Error("The AI service is rate limited right now. Please try again in a minute.");
      if (status === 402)
        throw new Error("AI credits are exhausted for this workspace. Add credits to continue.");
      console.error("tailorApplication AI failure", error);
      return fallbackTailor(jobText, resumeText);
    }
  });
