/**
 * Pure, framework-free domain logic for JobLens.
 * Everything here is deterministic and unit-tested (src/lib/tailor.test.ts).
 * It also powers the offline fallback when the AI gateway is unavailable.
 */

export const STOP_WORDS = new Set([
  "a","an","and","are","as","at","be","by","for","from","has","have","in","is","it","its","of","on","or","that","the","to","with","will","you","your","our","we","they","their","this","these","those","who","what","when","where","how","all","can","able","not","but","if","then","than","so","such","into","over","under","about","across","per","via","using","use","used","work","working","team","teams","role","job","candidate","experience","years","year","strong","excellent","good","great","plus","etc","other","must","should","would","like","new","help","ensure","including","include","includes","well","also","more","most","own","get","make","made","build","builds",
]);

export interface MatchReport {
  score: number;
  matched: string[];
  missing: string[];
}

export interface TailoredBullet {
  original: string;
  rewritten: string;
  rationale: string;
  keywords: string[];
}

export interface TailorResult {
  match: MatchReport;
  summary: string;
  bullets: TailoredBullet[];
  gaps: string[];
  source: "ai" | "fallback";
}

const TOKEN_RE = /[a-z0-9][a-z0-9+#.\-/]*/g;

export function tokenize(text: string): string[] {
  return (text.toLowerCase().match(TOKEN_RE) ?? [])
    .map((t) => t.replace(/^[.\-/]+|[.\-/]+$/g, ""))
    .filter((t) => t.length > 1);
}

/** Ranked keywords from a job description, most frequent first. */
export function extractKeywords(text: string, limit = 20): string[] {
  const counts = new Map<string, number>();
  for (const token of tokenize(text)) {
    if (STOP_WORDS.has(token) || /^\d+$/.test(token)) continue;
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([word]) => word);
}

/** Keyword-coverage score (0-100) of a resume against a job description. */
export function computeMatch(jobText: string, resumeText: string, limit = 20): MatchReport {
  const keywords = extractKeywords(jobText, limit);
  if (keywords.length === 0) return { score: 0, matched: [], missing: [] };

  const resumeTokens = new Set(tokenize(resumeText));
  const matched = keywords.filter((k) => resumeTokens.has(k));
  const missing = keywords.filter((k) => !resumeTokens.has(k));

  return {
    score: Math.round((matched.length / keywords.length) * 100),
    matched,
    missing,
  };
}

export function splitBullets(resumeText: string): string[] {
  return resumeText
    .split(/\r?\n+/)
    .map((line) => line.replace(/^\s*[-*•\d.]+\s*/, "").trim())
    .filter((line) => line.length > 2);
}

export const MIN_JOB_LENGTH = 80;
export const MIN_RESUME_LENGTH = 40;

export function validateInput(jobText: string, resumeText: string): string | null {
  if (jobText.trim().length < MIN_JOB_LENGTH)
    return `Job description is too short — paste at least ${MIN_JOB_LENGTH} characters.`;
  if (resumeText.trim().length < MIN_RESUME_LENGTH)
    return `Resume bullets are too short — paste at least ${MIN_RESUME_LENGTH} characters.`;
  return null;
}

export function scoreLabel(score: number): string {
  if (score >= 75) return "Strong match";
  if (score >= 50) return "Partial match";
  if (score >= 25) return "Weak match";
  return "Poor match";
}

/**
 * Deterministic, no-network tailoring used when the AI call fails.
 * Never invents achievements — it only surfaces the keyword analysis.
 */
export function fallbackTailor(jobText: string, resumeText: string): TailorResult {
  const match = computeMatch(jobText, resumeText);
  const bullets = splitBullets(resumeText)
    .slice(0, 6)
    .map<TailoredBullet>((original) => ({
      original,
      rewritten: original,
      rationale: "AI rewriting is unavailable, so your original wording is kept unchanged.",
      keywords: match.missing.filter((k) => !original.toLowerCase().includes(k)).slice(0, 3),
    }));

  return {
    match,
    summary: `Offline analysis: your bullets cover ${match.matched.length} of ${
      match.matched.length + match.missing.length
    } key terms from this posting.`,
    bullets,
    gaps: match.missing.slice(0, 6).map((k) => `The posting mentions "${k}" but your bullets do not.`),
    source: "fallback",
  };
}
