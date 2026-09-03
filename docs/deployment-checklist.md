# Deployment checklist

## Before every deploy

- [ ] `bun run test` — all tests pass (29/29).
- [ ] `bun run test:coverage` — statements ≥ 50% (currently ~97%).
- [ ] `bun run build` — production build succeeds with no errors.
- [ ] `bunx tsgo --noEmit` (or the editor's typecheck) — no type errors.
- [ ] Manual smoke test: paste a job posting + bullets, submit, confirm a
      rewritten result renders and the copy button works.
- [ ] Fallback smoke test: unset `LOVABLE_API_KEY` locally, submit, confirm the
      deterministic keyword analysis still renders with the "AI rewriting was
      unavailable" notice instead of an error screen.

## Environment

| Variable | Scope | Required | Notes |
| --- | --- | --- | --- |
| `LOVABLE_API_KEY` | server only | no | Lovable AI Gateway key. Read inside the server-function handler; never exposed to the browser. Absent ⇒ the app degrades to the deterministic fallback. |

### Deploying outside Lovable (Vercel, Netlify, …)

Lovable injects `LOVABLE_API_KEY` in the Lovable preview and on Lovable
hosting only. On any other host:

- [ ] Add `LOVABLE_API_KEY` in the host's environment settings (Vercel:
      Settings → Environment Variables) for Production, Preview and
      Development. Server-side variable — never prefix it with `VITE_`.
- [ ] Redeploy: environment changes do not apply to builds that already ran.
- [ ] Re-test one tailoring request; the "AI is not configured on this
      deployment" notice must be gone.

There is no database, no auth, no storage bucket and no migration step. Nothing
the user pastes is persisted, logged or sent anywhere except the AI gateway for
the duration of the request.

## Security review

- [ ] No secrets in client code — `process.env` is only read inside
      `.handler()` in `src/lib/tailor.functions.ts`.
- [ ] Server-side validation: `TailorInput` (Zod) re-validates length and tone
      on the server; the client checks are UX only.
- [ ] CSRF middleware is registered in `src/start.ts` for server functions.
- [ ] Input caps enforced (12,000 chars per field, 8 bullets per request) to
      bound cost and latency.
- [ ] Model output is treated as untrusted: rendered as text only, never as
      HTML, and re-validated against a Zod schema before use.

## Deploy

1. Push to the connected repo / click **Publish** in Lovable.
2. Frontend changes go live after clicking **Update** in the publish dialog;
   server functions deploy with the same build.
3. Record the live URL in `README.md`.

## After deploy

- [ ] Load the live URL — page renders, no console errors.
- [ ] Run one real tailoring request end to end against production.
- [ ] Re-run Lighthouse against the live URL and record the score in
      `docs/audits.md` (target ≥ 85 in every category).
- [ ] Re-run axe against the live URL — expect 0 WCAG AA violations.
- [ ] Check `robots.txt` and page metadata (title < 60 chars, description
      < 160 chars, `og:` and `twitter:` tags present).

## Rollback

The app is stateless, so rollback is a redeploy of the previous build — there
is no data migration to reverse.
