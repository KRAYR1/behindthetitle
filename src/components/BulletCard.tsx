import { useState } from "react";
import { Check, Copy } from "lucide-react";

import type { TailoredBullet } from "@/lib/tailor";

export function BulletCard({ bullet, index }: { bullet: TailoredBullet; index: number }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(bullet.rewritten);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <li className="panel p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="font-display text-sm font-semibold text-foreground">Bullet {index + 1}</p>
        <button
          type="button"
          onClick={copy}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
        >
          {copied ? <Check aria-hidden="true" className="size-3.5" /> : <Copy aria-hidden="true" className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
          <span className="sr-only"> rewritten bullet {index + 1}</span>
        </button>
      </div>

      <p className="mt-3 text-base leading-relaxed text-foreground">{bullet.rewritten}</p>

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
          Original &amp; why it changed
        </summary>
        <p className="mt-2 border-l-2 border-border pl-3 text-muted-foreground italic">{bullet.original}</p>
        <p className="mt-2 text-muted-foreground">{bullet.rationale}</p>
      </details>

      {bullet.keywords.length > 0 && (
        <ul aria-label={`Keywords covered by bullet ${index + 1}`} className="mt-3 flex flex-wrap gap-1.5">
          {bullet.keywords.map((keyword) => (
            <li
              key={keyword}
              className="rounded-full bg-accent/12 px-2.5 py-1 text-xs font-medium text-accent"
            >
              {keyword}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
