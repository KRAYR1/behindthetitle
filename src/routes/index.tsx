import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { AlertTriangle } from "lucide-react";

import { BulletCard } from "@/components/BulletCard";
import { MatchScore } from "@/components/MatchScore";
import { TailorForm, type Tone } from "@/components/TailorForm";
import { tailorApplication } from "@/lib/tailor.functions";
import { validateInput, type TailorResult } from "@/lib/tailor";

const TITLE = "Behind The Title";
const DESCRIPTION =
  "Paste any job description. See what they're actually asking for.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [jobText, setJobText] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [tone, setTone] = useState<Tone>("impact");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TailorResult | null>(null);

  const tailor = useServerFn(tailorApplication);
  const mutation = useMutation({
    mutationFn: (input: { jobText: string; resumeText: string; tone: Tone }) =>
      tailor({ data: input }) as Promise<TailorResult>,
    onSuccess: (data) => {
      setResult(data);
      setError(null);
    },
    onError: (err: Error) => {
      setResult(null);
      setError(err.message || "Something went wrong. Please try again.");
    },
  });

  const submit = () => {
    const validationError = validateInput(jobText, resumeText);
    if (validationError) {
      setError(validationError);
      setResult(null);
      return;
    }
    setError(null);
    mutation.mutate({ jobText, resumeText, tone });
  };

  return (
    <main className="min-h-screen">
      <header className="paper-grid border-b border-border">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:py-20">
          <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            {TITLE}
          </p>
          <p className="mt-2 text-base italic text-muted-foreground">{DESCRIPTION}</p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold leading-tight text-foreground sm:text-5xl">
            Stop guessing why your application was filtered out.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Paste a posting and your own bullets. You get a keyword match score, honestly rewritten
            bullets that never invent experience, and the gaps worth addressing before you apply.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
        <TailorForm
          jobText={jobText}
          resumeText={resumeText}
          tone={tone}
          pending={mutation.isPending}
          error={error}
          onJobChange={setJobText}
          onResumeChange={setResumeText}
          onToneChange={setTone}
          onSubmit={submit}
        />

        {result && (
          <section aria-labelledby="results-heading" className="space-y-6">
            <h2 id="results-heading" className="font-display text-2xl font-bold text-foreground">
              Your tailored application
            </h2>

            {result.source === "fallback" && (
              <div
                role="status"
                className="rounded-lg border border-warning/40 bg-warning/10 p-4 text-sm text-foreground"
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />
                  <div className="space-y-1">
                    <p className="font-medium">AI rewriting is unavailable right now.</p>
                    <p>You are seeing the offline keyword analysis and your bullets are shown unchanged.</p>
                    {result.reason && (
                      <p className="font-medium text-warning">Reason: {result.reason}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_18rem] md:items-start">
              <div className="space-y-6 md:order-1">
                <p className="panel p-5 text-base text-foreground">{result.summary}</p>

                <ul className="space-y-4">
                  {result.bullets.map((bullet, index) => (
                    <BulletCard key={`${index}-${bullet.rewritten}`} bullet={bullet} index={index} />
                  ))}
                </ul>

                {result.gaps.length > 0 && (
                  <section aria-labelledby="gaps-heading" className="panel p-5">
                    <h3 id="gaps-heading" className="font-display text-lg font-semibold text-foreground">
                      Honest gaps
                    </h3>
                    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                      {result.gaps.map((gap) => (
                        <li key={gap}>{gap}</li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>

              <div className="md:order-2">
                <MatchScore match={result.match} />
              </div>
            </div>
          </section>
        )}
      </div>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-muted-foreground">
          Nothing you paste is stored.
        </div>
      </footer>
    </main>
  );
}
