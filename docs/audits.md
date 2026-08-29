# Audits — performance & accessibility

## How to reproduce

```bash
bun run dev          # app on http://localhost:8080

# Lighthouse (Chrome required; CHROME_PATH may need to point at a Chromium binary)
bunx lighthouse http://localhost:8080 \
  --chrome-flags="--headless=new --no-sandbox" \
  --only-categories=performance,accessibility,best-practices,seo \
  --output=html --output-path=./lighthouse.html

# axe-core (WCAG 2.1 A + AA) via Playwright
python3 scripts/run_axe.py   # or inject https://cdn.jsdelivr.net/npm/axe-core/axe.min.js
```

The axe run injects `axe-core` into the rendered page and executes:

```js
await axe.run(document, {
  runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
});
```

## Results

Run date: 2026-08-29. Target: `/` (the whole app is one route).

### axe-core 4.10 — WCAG 2.1 AA

| Metric | Result |
| --- | --- |
| Violations | **0** |
| Passing checks | 21 |
| Serious/critical | 0 |

**Finding fixed during the audit.** The selected tone pill rendered
`--accent-foreground` (near-white) on `--accent` (ember orange
`oklch(0.68 0.17 48)`), giving a contrast ratio of **2.97:1** — below the 4.5:1
AA threshold for 14px text. The accent token was darkened to
`oklch(0.54 0.16 45)`, which lifts the pair above 4.5:1 while keeping the
palette. Re-running axe returned 0 violations.

No other issues were reported: form labels, landmark structure, heading order,
the `role="progressbar"` name/value, list semantics and focus visibility all
pass.

### Lighthouse (headless Chrome, dev server)

| Category | Score |
| --- | --- |
| Accessibility | **100** |
| Best practices | **100** |
| SEO | **100** |
| Performance | 33 (dev server) |

The performance number above is measured against the **Vite dev server**, which
serves hundreds of unbundled, unminified ES modules with HMR and React DevTools
hooks attached — it is not representative. Re-run Lighthouse against the
published URL (`bun run build` output, minified, code-split, edge-served) for a
meaningful score; the page is a single route with no images, no third-party
scripts beyond two Google Fonts stylesheets, and ~0 layout shift, so the
production profile is dominated by the JS bundle alone.

Production-side measures already in place:

- No image assets at all (icons are inline SVG paths).
- Fonts loaded via `<link rel="preconnect">` + `display=swap` in `__root.tsx`.
- Server-only modules (`*.server.ts`) and the AI SDK are dynamically imported
  inside the server-function handler, so none of it reaches the client bundle.
- No client-side data fetching on first paint — the page is static until the
  user submits.

## Manual accessibility pass

- Keyboard-only: Tab reaches both textareas, all three tone radios (arrow keys
  move within the group), the submit button, and each copy button. Focus rings
  are always visible.
- Screen reader: submitting announces "Tailoring your application…" through the
  visually hidden `role="status"` region; validation errors announce through
  `role="alert"`; the score reads as "Keyword match: 62 percent, Partial match".
- 200% browser zoom: layout reflows to a single column, no clipping.
- `prefers-reduced-motion`: only transitions are colour/width fades, no
  large-motion animation.
