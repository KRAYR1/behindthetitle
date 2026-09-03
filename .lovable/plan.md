# Fix: AI fallback banner on the Vercel deployment

## What's happening

The banner appears because the server function cannot reach the AI gateway from
your Vercel deployment. In the code, if `LOVABLE_API_KEY` is not present in the
server environment, `tailorApplication` immediately returns the offline
keyword analysis with the reason "The AI service is not configured for this
deployment."

Lovable injects that key automatically in the Lovable preview and on Lovable
hosting. Vercel is a separate host with its own environment — nothing is
injected there, so the key is missing unless you add it manually.

## Fix

1. Add `LOVABLE_API_KEY` as an environment variable in the Vercel project
   (Settings > Environment Variables), for Production, Preview and Development.
2. Redeploy so the new variable is picked up (env changes do not apply to
   existing builds).
3. Re-test: submit a posting + bullets and confirm the banner is gone and the
   bullets come back rewritten.

## Make the failure self-explanatory

So this is never guesswork again, I'll surface the exact reason on the banner
path and make the "not configured" case unmistakable:

- Show `result.reason` prominently in the warning banner (it is currently
  rendered but easy to miss) and use a distinct wording for the
  missing-key case: "AI is not configured on this deployment."
- Add a short "Deploying outside Lovable" section to `README.md` and
  `docs/deployment-checklist.md` listing `LOVABLE_API_KEY` as a required
  server-side variable on Vercel, and noting that the app degrades to the
  offline analysis without it.

## Technical notes

- The key is read inside `.handler()` in `src/lib/tailor.functions.ts`; it is
  server-only and never reaches the browser, so it must exist in the Vercel
  server runtime env (not a `VITE_`-prefixed variable).
- No code change is needed to make AI work on Vercel — only the env variable.
  The code edits above are for clearer diagnostics.
- Alternative: publish from Lovable instead, where the key is provided
  automatically and no configuration is needed.
