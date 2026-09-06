# Enable JobLens AI on Vercel

## Goal
Make the deployed JobLens site use Gemini successfully while keeping the API key private.

## Steps
1. Create a Gemini API key in [Google AI Studio](https://aistudio.google.com/apikey).
2. In the Vercel project, open **Settings → Environment Variables** and add:
   - Name: `GEMINI_API_KEY`
   - Value: the Gemini key from Google AI Studio
   - Environments: **Production**, **Preview**, and **Development**
3. Do not use a `VITE_` prefix. The existing app reads `GEMINI_API_KEY` only in its server-side tailoring function, so the key is not sent to the browser.
4. Redeploy the latest Vercel deployment so it receives the new environment variable.
5. Submit one tailoring request on the deployed site and confirm it returns AI-rewritten bullets without the offline-analysis warning.
6. If the warning remains, inspect the Vercel function logs for the tailoring request and address the exact Gemini response (for example, invalid key, model access, or quota).

## Current implementation
- The app already prioritizes `GEMINI_API_KEY` when present.
- It falls back to Lovable’s gateway only when that variable is absent.
- No source-code change or hardcoded key is required.
