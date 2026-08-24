import { scoreLabel, type MatchReport } from "@/lib/tailor";

export function MatchScore({ match }: { match: MatchReport }) {
  const label = scoreLabel(match.score);

  return (
    <section aria-labelledby="match-heading" className="panel p-5">
      <h3 id="match-heading" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Keyword match
      </h3>

      <div className="mt-3 flex items-baseline gap-3">
        <p className="font-display text-4xl font-bold text-foreground">{match.score}%</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>

      <div
        role="progressbar"
        aria-valuenow={match.score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Keyword match: ${match.score} percent, ${label}`}
        className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-500"
          style={{ width: `${match.score}%` }}
        />
      </div>

      {match.missing.length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Missing keywords
          </h4>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {match.missing.map((keyword) => (
              <li
                key={keyword}
                className="rounded-full border border-border bg-secondary px-2.5 py-1 text-xs text-secondary-foreground"
              >
                {keyword}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
