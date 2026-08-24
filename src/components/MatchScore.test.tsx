import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MatchScore } from "./MatchScore";

describe("MatchScore", () => {
  const match = { score: 62, matched: ["react"], missing: ["accessibility", "vitest"] };

  it("renders an accessible progressbar with the score", () => {
    render(<MatchScore match={match} />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "62");
    expect(bar).toHaveAccessibleName(/62 percent/i);
    expect(screen.getByText("62%")).toBeInTheDocument();
    expect(screen.getByText("Partial match")).toBeInTheDocument();
  });

  it("lists missing keywords", () => {
    render(<MatchScore match={match} />);
    expect(screen.getByText("accessibility")).toBeInTheDocument();
    expect(screen.getByText("vitest")).toBeInTheDocument();
  });

  it("hides the missing keywords section on a perfect match", () => {
    render(<MatchScore match={{ score: 100, matched: ["react"], missing: [] }} />);
    expect(screen.queryByText(/missing keywords/i)).not.toBeInTheDocument();
    expect(screen.getByText("Strong match")).toBeInTheDocument();
  });
});
