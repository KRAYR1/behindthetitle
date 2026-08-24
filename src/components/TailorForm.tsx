import { Loader2, Sparkles } from "lucide-react";

export type Tone = "impact" | "concise" | "technical";

interface Props {
  jobText: string;
  resumeText: string;
  tone: Tone;
  pending: boolean;
  error: string | null;
  onJobChange: (value: string) => void;
  onResumeChange: (value: string) => void;
  onToneChange: (tone: Tone) => void;
  onSubmit: () => void;
}

const TONES: { value: Tone; label: string }[] = [
  { value: "impact", label: "Impact" },
  { value: "concise", label: "Concise" },
  { value: "technical", label: "Technical" },
];

export function TailorForm({
  jobText,
  resumeText,
  tone,
  pending,
  error,
  onJobChange,
  onResumeChange,
  onToneChange,
  onSubmit,
}: Props) {
  return (
    <form
      className="panel p-5 sm:p-6"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label htmlFor="job" className="block text-sm font-semibold text-foreground">
            Job description
          </label>
          <p id="job-hint" className="mt-1 text-xs text-muted-foreground">
            Paste the full posting, including the requirements section.
          </p>
          <textarea
            id="job"
            name="job"
            value={jobText}
            onChange={(event) => onJobChange(event.target.value)}
            aria-describedby="job-hint"
            rows={10}
            className="mt-2 w-full resize-y rounded-lg border border-input bg-background p-3 font-sans text-sm text-foreground placeholder:text-muted-foreground"
            placeholder="Senior Frontend Engineer — you will build accessible React interfaces…"
          />
        </div>

        <div>
          <label htmlFor="resume" className="block text-sm font-semibold text-foreground">
            Your resume bullets
          </label>
          <p id="resume-hint" className="mt-1 text-xs text-muted-foreground">
            One achievement per line. Nothing is invented — only rephrased.
          </p>
          <textarea
            id="resume"
            name="resume"
            value={resumeText}
            onChange={(event) => onResumeChange(event.target.value)}
            aria-describedby="resume-hint"
            rows={10}
            className="mt-2 w-full resize-y rounded-lg border border-input bg-background p-3 font-sans text-sm text-foreground placeholder:text-muted-foreground"
            placeholder={"- Built a dashboard used by 200 people\n- Reduced page load time by 40%"}
          />
        </div>
      </div>

      <fieldset className="mt-5">
        <legend className="text-sm font-semibold text-foreground">Rewrite tone</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {TONES.map((option) => (
            <label
              key={option.value}
              className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                tone === option.value
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-background text-foreground hover:bg-secondary"
              }`}
            >
              <input
                type="radio"
                name="tone"
                value={option.value}
                checked={tone === option.value}
                onChange={() => onToneChange(option.value)}
                className="sr-only"
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Sparkles aria-hidden="true" className="size-4" />
          )}
          {pending ? "Tailoring…" : "Tailor my application"}
        </button>
        <p className="text-xs text-muted-foreground">Nothing is stored — analysis happens per request.</p>
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {pending ? "Tailoring your application, please wait." : ""}
      </p>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}
    </form>
  );
}
