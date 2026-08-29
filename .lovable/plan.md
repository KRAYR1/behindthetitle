# Remove "Capstone project" label from homepage

## Goal
Remove the rendered line that says "Capstone project" from the hero of the Job Application Tailor homepage.

## Location
`src/routes/index.tsx`, lines 67-70 — a `<p>` badge inside the `<header>` containing the text "Capstone project".

## Proposed change
Delete the entire `<p className="inline-flex ...">...</p>` element (lines 67-70) so the header flows directly from the top padding to the `<h1>`.

## Verification
- Read the updated `src/routes/index.tsx` to confirm the badge is gone.
- Check the live preview to confirm the hero no longer displays "Capstone project".
