import { describe, expect, it } from "vitest";

import {
  computeMatch,
  extractKeywords,
  fallbackTailor,
  scoreLabel,
  splitBullets,
  tokenize,
  validateInput,
} from "./tailor";

const JOB = `Senior Frontend Engineer. You will build accessible React interfaces with TypeScript.
Requirements: React, TypeScript, accessibility, testing with Vitest, performance optimisation.
React and TypeScript experience is essential for this accessibility focused role.`;

const RESUME = `- Built React dashboards used by 200 people daily
- Improved performance by 40% by code splitting
- Wrote TypeScript utilities shared across three teams`;

describe("tokenize", () => {
  it("lowercases and keeps tech tokens intact", () => {
    expect(tokenize("React, TypeScript and Node.js")).toEqual([
      "react",
      "typescript",
      "and",
      "node.js",
    ]);
  });

  it("drops single characters and punctuation", () => {
    expect(tokenize("a b CI/CD!")).toEqual(["ci/cd"]);
  });
});

describe("extractKeywords", () => {
  it("ranks repeated domain terms above noise and removes stop words", () => {
    const keywords = extractKeywords(JOB, 6);
    expect(keywords).toContain("react");
    expect(keywords).toContain("typescript");
    expect(keywords).not.toContain("the");
    expect(keywords).toHaveLength(6);
  });

  it("returns an empty list for empty input", () => {
    expect(extractKeywords("")).toEqual([]);
  });
});

describe("computeMatch", () => {
  it("scores keyword coverage between 0 and 100", () => {
    const match = computeMatch(JOB, RESUME);
    expect(match.score).toBeGreaterThan(0);
    expect(match.score).toBeLessThanOrEqual(100);
    expect(match.matched).toContain("react");
    expect(match.missing).toContain("accessibility");
  });

  it("returns a zero score when the job text has no keywords", () => {
    expect(computeMatch("", RESUME)).toEqual({ score: 0, matched: [], missing: [] });
  });

  it("scores 100 when the resume repeats the job text", () => {
    expect(computeMatch(JOB, JOB).score).toBe(100);
  });
});

describe("splitBullets", () => {
  it("strips list markers and blank lines", () => {
    expect(splitBullets("- one\n\n* two\n1. three\n \n")).toEqual(["one", "two", "three"]);
  });
});

describe("validateInput", () => {
  it("rejects a short job description", () => {
    expect(validateInput("too short", RESUME)).toMatch(/job description/i);
  });

  it("rejects short resume bullets", () => {
    expect(validateInput(JOB, "hi")).toMatch(/resume/i);
  });

  it("accepts valid input", () => {
    expect(validateInput(JOB, RESUME)).toBeNull();
  });
});

describe("scoreLabel", () => {
  it.each([
    [90, "Strong match"],
    [60, "Partial match"],
    [30, "Weak match"],
    [5, "Poor match"],
  ])("labels %i as %s", (score, label) => {
    expect(scoreLabel(score)).toBe(label);
  });
});

describe("fallbackTailor", () => {
  it("never rewrites the user's bullets and flags the offline source", () => {
    const result = fallbackTailor(JOB, RESUME);
    expect(result.source).toBe("fallback");
    expect(result.bullets.length).toBeGreaterThan(0);
    for (const bullet of result.bullets) {
      expect(bullet.rewritten).toBe(bullet.original);
    }
    expect(result.gaps.length).toBeGreaterThan(0);
  });
});
