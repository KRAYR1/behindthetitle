# JobLens

Paste a job posting and your own resume bullets. The app scores how well your
experience matches the posting's language, rewrites each bullet so it speaks to
that posting — **without inventing anything** — and names the honest gaps you
should address before applying.

Live URL: _add the published Lovable URL here after deploying._

---

## Why this app

Most "AI resume" tools happily fabricate employers, metrics and technologies.
That gets candidates caught in interviews. This app takes the opposite stance:

- The model may only **rephrase and re-frame** bullets the candidate wrote.
- Keyword coverage is computed **deterministically in code**, not by the model,
  so the score can't be hallucinated.
- If the model can't truthfully improve a bullet, it returns it unchanged and
  says so in the rationale.
- Gaps are surfaced explicitly instead of being papered over.

## Features

- **Match score (0–100)** with matched / missing keyword lists, rendered as an
  accessible progress bar.
- **Bullet rewrites** with a per-bullet rationale, the original text for
  comparison, the job keywords each bullet now covers, and copy-to-clipboard.
- **Three tones**: Impact, Concise, Technical.
- **Honest gaps** — up to five things the candidate genuinely lacks.
- **Offline fallback** — if the AI gateway is missing, rate-limited or returns
  something unusable, the app still returns the deterministic keyword analysis
  and tells the user AI rewriting was unavailable.

## Getting started

```bash
bun install         # or npm install
bun run dev         # http://localhost:8080
bun run test        # unit + component tests
bun run test:coverage
bun run build       # production build
```

### Environment

| Variable           | Required | Purpose                                                        |
| ------------------ | -------- | -------------------------------------------------------------- |
| `LOVABLE_API_KEY`  | no       | Server-only key for the Lovable AI Gateway. Missing ⇒ fallback. |

The key is read **inside the server function handler** and never reaches the
browser. No other configuration is needed — there is no database and nothing a
user pastes is persisted.

## Architecture

```text
src/
  routes/
    __root.tsx        shell, fonts, base metadata
    index.tsx         page: state, validation, mutation, layout
  components/
    TailorForm.tsx    labelled textareas, tone radio group, submit + errors
    MatchScore.tsx    accessible progressbar + matched/missing keywords
    BulletCard.tsx    rewritten bullet, original, rationale, copy button
  lib/
    tailor.ts             pure domain logic (no I/O, 100% covered by tests)
    tailor.functions.ts   createServerFn RPC entry point (thin wrapper)
    tailor-prompt.server.ts  Zod schemas + prompt builders (server-only)
    ai-gateway.server.ts     Lovable AI Gateway provider (server-only)
```

**Stack**: TanStack Start v1 (React 19, SSR, server functions) · Vite 7 ·
Tailwind CSS v4 · TanStack Query · Vercel AI SDK · Zod · Vitest +
Testing Library.

**Data flow**

1. The page validates input on the client (length checks) and shows an
   `role="alert"` message on failure — no request is made.
2. `tailorApplication` (a `createServerFn` POST) re-validates with Zod on the
   server. Never trust the client.
3. The server computes the deterministic match score, then asks the model to
   rewrite the bullets.
4. The rewritten bullets are re-scored; the higher of the two scores is
   returned, so the number shown always reflects real keyword coverage.
5. Any failure degrades to `fallbackTailor()` instead of erroring out.

Domain logic is deliberately a pure module (`src/lib/tailor.ts`): keyword
extraction, stop-word filtering, stemming-ish normalisation, scoring and the
fallback path are all synchronous, dependency-free functions, which is what
makes the high test coverage cheap and meaningful.

## AI integration

- **Gateway**: Lovable AI Gateway (`https://ai.gateway.lovable.dev/v1`), an
  OpenAI-compatible endpoint, via `@ai-sdk/openai-compatible`.
- **Model**: `google/gemini-2.5-flash` — fast and inexpensive; the task is
  rewriting, not reasoning-heavy.
- **Structured output**: `generateObject` with a Zod schema
  (`summary`, `bullets[]{original, rewritten, rationale, keywords[]}`,
  `gaps[]`). Malformed output throws and is caught by the fallback.
- **System prompt** (see `src/lib/tailor-prompt.server.ts`):
  > You are a hiring-manager-grade resume editor. Rewrite each of the
  > candidate's existing bullets so it speaks directly to the job posting.
  > Absolute rule: never invent employers, titles, metrics, or technologies the
  > candidate did not state. If a bullet cannot be improved truthfully, return
  > it unchanged and say so in the rationale. _+ one tone directive._
- **User prompt** carries the posting, the numbered original bullets, and the
  keywords the resume is currently missing.
- **Failure handling**: HTTP 429 → "rate limited, try again in a minute";
  HTTP 402 → "AI credits exhausted"; anything else (schema mismatch, network,
  timeout, empty output) → deterministic fallback with a visible notice.

## Accessibility

- Semantic landmarks (`header`, `main`, `footer`), one `h1`, ordered headings.
- Every input has a real `<label htmlFor>`; hints are wired via
  `aria-describedby`; tone options are a `fieldset`/`legend` radio group.
- The score is `role="progressbar"` with `aria-valuenow/min/max` and an
  accessible name ("62 percent keyword match").
- Errors use `role="alert"`; pending state is announced through a visually
  hidden `role="status" aria-live="polite"` region and the button label.
- Icons are `aria-hidden`; the copy button carries `sr-only` context so
  "Copy rewritten bullet 3" is distinguishable in a screen-reader list.
- Colours are OKLCH design tokens chosen for AA contrast; no `outline: none`.

See `docs/audits.md` for how to run and record the audits.

## Testing

29 tests across 4 files: pure-logic tests for `tailor.ts` (tokenising,
stop-words, ranking, scoring, fallback, edge cases) and behavioural component
tests driven through accessible queries (`getByRole`, `getByLabelText`).

Latest run: **29 passed**, statements **96.9%**, branches **100%**,
lines **98.2%** — comfortably above the 50% requirement.

```
File             | % Stmts | % Branch | % Funcs | % Lines
All files        |   96.96 |      100 |   93.33 |   98.27
 BulletCard.tsx  |      90 |      100 |      75 |     100
 MatchScore.tsx  |     100 |      100 |     100 |     100
 TailorForm.tsx  |    87.5 |      100 |   83.33 |    87.5
 lib/tailor.ts   |     100 |      100 |     100 |     100
```

## Limitations

- Keyword matching is lexical, not semantic: "k8s" and "Kubernetes" are treated
  as different terms.
- English only; the stop-word list is English.
- Bullets are capped at 8 per request and inputs at 12,000 characters to keep
  latency and cost predictable.
- No file upload — resumes are pasted as plain text (no PDF parsing).
- Nothing is persisted, so there is no history, accounts or saved versions.
- The model can still be bland; it cannot verify claims, only avoid adding new
  ones. Users must review every rewrite.
- The fallback path returns bullets unchanged — it is a safety net, not a
  substitute for the model.

## Docs

- [`docs/deployment-checklist.md`](docs/deployment-checklist.md)
- [`docs/audits.md`](docs/audits.md) — Lighthouse / axe procedure and results
- [`docs/reflection.md`](docs/reflection.md)
