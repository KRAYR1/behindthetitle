# LinkedIn Post — Behind The Title

Copy the text below and paste it into your LinkedIn post. Replace `[LIVE_URL]` with the published link before sharing.

---

I’m excited to share the capstone project I built during my Frontend AI Developer Internship at Flyrank AI: **Behind The Title**.

Most AI resume tools rewrite your experience until it sounds impressive — but they also invent metrics, technologies, and responsibilities you never had. That does not help anyone in an interview.

So I built the opposite.

Paste any job description and your own resume bullets, and the app gives you:
- A keyword match score (0–100) with matched and missing terms
- Honestly rewritten bullets that reframe what you already did — without inventing anything
- Visible skill gaps to address before you apply
- A deterministic offline fallback, so the app stays useful even when the AI gateway is unavailable

Tech stack: TanStack Start (React 19 + SSR), Tailwind CSS v4, Vercel AI SDK with structured output via Google Gemini / Lovable AI Gateway, Zod, Vitest + Testing Library.

Quality bar I aimed for and hit:
- 29 tests, ~97% statement coverage
- Lighthouse 100 for Accessibility, Best Practices, and SEO
- axe-core audit: 0 violations
- WCAG AA contrast across the UI

The biggest lesson? Shipping AI in production is not about the model — it is about graceful failure, honest output, and building trust with the user.

Check it out here: [LIVE_URL]

Would love your feedback, and happy to answer questions about the build.

#AI #FrontendDevelopment #React #WebAccessibility #CapstoneProject #FlyrankAI #Internship #Hiring #ResumeTips
