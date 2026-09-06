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

    const geminiKey = process.env["GEMINI_API_KEY"];
    const lovableKey = process.env["LOVABLE_API_KEY"];
    if (!geminiKey && !lovableKey)
      return fallbackTailor(
        jobText,
        resumeText,
        "AI is not configured on this deployment — set the GEMINI_API_KEY environment variable on your host and redeploy.",
      );

    const { generateObject } = await import("ai");

    let model;
    if (geminiKey) {
      const { createGeminiProvider } = await import("./gemini.server");
      model = createGeminiProvider(geminiKey)("gemini-3.6-flash");
    } else {
      const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
      model = createLovableAiGatewayProvider(lovableKey!)("google/gemini-2.5-flash");
    }

    const run = () =>
      generateObject({
        model,
        schema: AiSchema,
        system: buildSystemPrompt(tone),
        prompt: buildUserPrompt(jobText, originals, match.missing),
      });


    const statusOf = (error: unknown) =>
      (error as { statusCode?: number; status?: number })?.statusCode ??
      (error as { status?: number })?.status;

    let output: Awaited<ReturnType<typeof run>>["object"];
    try {
      output = (await run()).object;
    } catch (firstError) {
      const status = statusOf(firstError);
      if (status === 429)
        throw new Error("The AI service is rate limited right now. Please try again in a minute.");
      if (status === 402)
        throw new Error("AI credits are exhausted for this workspace. Add credits to continue.");

      // Structured-output responses occasionally come back malformed; one retry
      // recovers most of those before we drop to the offline analysis.
      try {
        output = (await run()).object;
      } catch (error) {
        const retryStatus = statusOf(error);
        if (retryStatus === 429)
          throw new Error("The AI service is rate limited right now. Please try again in a minute.");
        if (retryStatus === 402)
          throw new Error("AI credits are exhausted for this workspace. Add credits to continue.");
        console.error("tailorApplication AI failure", error);
        return fallbackTailor(
          jobText,
          resumeText,
          "The AI service did not return a usable rewrite after two attempts.",
        );
      }
    }

    const bullets = output.bullets
      .filter((b) => b.rewritten.trim().length > 0)
      .map((b, i) => ({
        original: b.original?.trim() || originals[i] || "",
        rewritten: b.rewritten.trim(),
        rationale: b.rationale?.trim() || "Aligned with the posting.",
        keywords: (b.keywords ?? []).slice(0, 5),
      }));

    if (bullets.length === 0)
      return fallbackTailor(jobText, resumeText, "The AI service returned no usable bullets.");

    const rewrittenMatch = computeMatch(jobText, bullets.map((b) => b.rewritten).join("\n"));

    return {
      match: rewrittenMatch.score >= match.score ? rewrittenMatch : match,
      summary: output.summary.trim(),
      bullets,
      gaps: output.gaps.slice(0, 5),
      source: "ai",
    };
  });
