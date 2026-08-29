# Reflection

## What I set out to prove

That an AI feature can be genuinely useful without being a chatbot, and without
the app falling over when the model does. The job-application tailor was chosen
because it has a real failure mode worth engineering around: resume tools that
hallucinate get candidates caught in interviews.

## What went well

**Splitting deterministic work from generative work.** Keyword extraction and
the 0–100 match score live in `src/lib/tailor.ts` — pure, synchronous,
dependency-free functions. The model never produces the score, so it cannot
inflate it. That single decision made the app both more trustworthy and far
cheaper to test: the pure module reached 100% coverage with plain unit tests and
no mocking.

**The fallback is a first-class path, not an afterthought.** `fallbackTailor()`
returns the same shape as the AI path, so the UI renders identically whether the
gateway answered, was rate-limited, or was never configured. Missing API key,
HTTP 402, schema mismatch, timeout — all of them land on a working page with an
honest notice rather than an error boundary.

**Structured output.** Moving from `generateText` + JSON parsing to
`generateObject` with a Zod schema removed a whole class of "the model wrapped
its JSON in a code fence" bugs. Malformed output now throws inside the SDK and
is caught by the same fallback.

**Accessibility from the start.** Building with `getByRole`/`getByLabelText`
queries in the component tests meant the accessible names had to be correct
before a test could pass. The axe audit then found exactly one real issue (a
contrast failure on the selected tone pill), not a backlog.

## What was harder than expected

**Server/client boundaries.** TanStack Start bundles aggressively, and a single
static import of a `.server.ts` module from a file the client touches drags the
AI SDK into the browser bundle. The fix was to keep `tailor.functions.ts` a thin
wrapper and dynamically import everything — Zod schemas, prompts, the gateway
provider — inside the handler.

**Judging "did the rewrite actually help?"** There is no ground truth. The
compromise: re-score the rewritten bullets deterministically and show the higher
of the two scores, so the number always reflects measured keyword coverage
rather than a claim.

**Prompt discipline.** Early prompts produced confident inventions ("led a team
of 6"). The absolute-rule phrasing plus an explicit escape hatch — "if a bullet
cannot be improved truthfully, return it unchanged and say so in the rationale"
— was what actually stopped it. Giving the model permission to do nothing
mattered more than telling it not to lie.

## What I'd do next

- Semantic keyword matching (embeddings) so "k8s" matches "Kubernetes".
- Streaming the rewrites so the first bullet appears in ~1s instead of waiting
  for the whole object.
- A diff view highlighting exactly which words changed per bullet.
- PDF/DOCX upload with client-side text extraction.
- Persisted history behind auth, so a candidate can compare tailorings across
  postings.
- A small eval set of posting/resume pairs with assertions that no entity in the
  output is absent from the input — automated hallucination regression testing.

## Biggest takeaway

The interesting engineering in an AI feature is almost entirely around the model
call, not in it: validating what goes in, constraining what comes out,
computing anything that must be trustworthy in ordinary code, and making sure
the product still works on the day the model doesn't.
