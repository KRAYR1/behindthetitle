import { createServerFn } from "@tanstack/react-start";

import type { TailorResult } from "./tailor";

export const tailorApplication = createServerFn({ method: "POST" })
  .inputValidator(async (input: unknown) => {
    const { TailorInput } = await import("./tailor-prompt.server");
    return TailorInput.parse(input);
  })
  .handler(async ({ data }): Promise<TailorResult> => {
    const { computeMatch, fallbackTailor, splitBullets } = await import("./tailor");
    const { AiSchema, buildSystemPrompt, buildUserPrompt } = await import("./tailor-prompt.server");

    const { jobText, resumeText, tone } = data;
    const match = computeMatch(jobText, resumeText);
    const originals = splitBullets(resumeText).slice(0, 8);

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return fallbackTailor(jobText, resumeText);

    const { generateText, Output } = await import("ai");
    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(apiKey);

    try {
      const { output } = await generateText({
        model: gateway("google/gemini-2.5-flash"),
        output: Output.object({ schema: AiSchema }),
        system: buildSystemPrompt(tone),
        prompt: buildUserPrompt(jobText, originals, match.missing),
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

      const rewrittenMatch = computeMatch(jobText, bullets.map((b) => b.rewritten).join("\n"));

      return {
        match: rewrittenMatch.score >= match.score ? rewrittenMatch : match,
        summary: output.summary.trim(),
        bullets,
        gaps: output.gaps.slice(0, 5),
        source: "ai",
      };
    } catch (error) {
      const status =
        (error as { statusCode?: number; status?: number })?.statusCode ??
        (error as { status?: number })?.status;
      if (status === 429)
        throw new Error("The AI service is rate limited right now. Please try again in a minute.");
      if (status === 402)
        throw new Error("AI credits are exhausted for this workspace. Add credits to continue.");
      console.error("tailorApplication AI failure", error);
      return fallbackTailor(jobText, resumeText);
    }
  });
