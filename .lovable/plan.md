# Why the new title isn't on Vercel — and how to fix it

## The cause

The "Behind The Title" change is committed in this project (commit `6fe146c`), but Vercel only shows what it has **built and deployed**. Your live Vercel site is still serving an older deployment from before this change. Nothing is wrong with the code.

## Fix steps (on your side, ~2 minutes)

1. **Check the GitHub sync**: Lovable pushes code to your connected GitHub repo. Open your GitHub repo and confirm the latest commit `6fe146c "Updated page title to Behind The Title"` is there.
   - If it's missing: in Lovable, go to **Settings → GitHub** and make sure the repo is still connected, then ask me to push/sync.
2. **Trigger a Vercel redeploy**: In Vercel → your project → **Deployments**:
   - If Vercel is connected to GitHub, it auto-deploys on each push — check whether a new deployment for `6fe146c` was created. If it's stuck or failed, click **⋯ → Redeploy**.
   - Make sure you're viewing the **Production** deployment, not an old preview deployment URL.
3. **Hard-refresh the page**: Browsers cache page metadata aggressively. Press **Ctrl+Shift+R** (Cmd+Shift+R on Mac), or test in an incognito window.

## If it still shows the old title

- Confirm the Vercel deployment's commit hash matches `6fe146c` (shown on the deployment card in Vercel).
- If Vercel deployed successfully but the old title persists, send me your Vercel URL and I'll inspect what it's serving.

## Technical details

- No code changes needed — `src/routes/index.tsx` already sets the title and meta tags to "Behind The Title".
- Root cause is deployment staleness, not a code bug.
