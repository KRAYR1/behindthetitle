# Use your own Gemini key for the AI rewriting

Right now the rewriting only works where Lovable injects its own AI key, which is why the deployed copy on Vercel keeps falling back to the offline keyword analysis. This change lets the app use a Google Gemini API key that you paste into your host's settings.

## How it will work

- The app looks for a Gemini key first. If it finds one, it calls Gemini directly.
- If there's no Gemini key, it still tries the Lovable AI key (so the Lovable preview keeps working unchanged).
- If neither is set, it falls back to the offline analysis and the banner says exactly which key is missing.

## What you'll need to do

1. Create a Gemini API key at Google AI Studio.
2. Add it in Vercel under Settings → Environment Variables with the name `GEMINI_API_KEY` (Production, Preview, Development). No `VITE_` prefix — it must stay server-side.
3. Redeploy.

I'll also add the key in Lovable so the preview here uses the same path, if you want to test it before deploying.

## Technical notes

- Add `@ai-sdk/google` and a `createGeminiProvider()` helper in a server-only module alongside `src/lib/ai-gateway.server.ts`.
- In `src/lib/tailor.functions.ts`, select the provider inside the handler: `GEMINI_API_KEY` → Google provider with model `gemini-2.5-flash`; else `LOVABLE_API_KEY` → existing gateway provider; else fallback with an updated reason string.
- Keep the existing retry, 429/402 handling, empty-output guard, and structured `generateObject` schema untouched.
- Update `README.md` and `docs/deployment-checklist.md` to document `GEMINI_API_KEY` as the recommended variable for non-Lovable hosts.
- Run typecheck plus the existing 29 tests; add no new secrets to client code.
