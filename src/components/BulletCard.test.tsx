import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BulletCard } from "./BulletCard";

const bullet = {
  original: "Worked on the dashboard.",
  rewritten: "Shipped an accessible React dashboard used by 4k weekly users.",
  rationale: "Adds scale and the accessibility keyword from the job ad.",
  keywords: ["react", "accessibility"],
};

describe("BulletCard", () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it("renders the rewritten bullet, original and rationale", () => {
    render(
      <ul>
        <BulletCard bullet={bullet} index={0} />
      </ul>,
    );
    expect(screen.getByText(/Bullet 1/)).toBeInTheDocument();
    expect(screen.getByText(bullet.rewritten)).toBeInTheDocument();
    expect(screen.getByText(bullet.original)).toBeInTheDocument();
    expect(screen.getByText(bullet.rationale)).toBeInTheDocument();
  });

  it("lists covered keywords in a labelled list", () => {
    render(
      <ul>
        <BulletCard bullet={bullet} index={1} />
      </ul>,
    );
    expect(screen.getByRole("list", { name: /keywords covered by bullet 2/i })).toBeInTheDocument();
  });

  it("copies the rewritten text and confirms it", async () => {
    render(
      <ul>
        <BulletCard bullet={bullet} index={0} />
      </ul>,
    );
    await userEvent.click(screen.getByRole("button", { name: /copy/i }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(bullet.rewritten);
    expect(await screen.findByRole("button", { name: /copied/i })).toBeInTheDocument();
  });

  it("stays usable when the clipboard is blocked", async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });
    render(
      <ul>
        <BulletCard bullet={{ ...bullet, keywords: [] }} index={0} />
      </ul>,
    );
    await userEvent.click(screen.getByRole("button", { name: /copy/i }));
    expect(screen.getByRole("button", { name: /copy/i })).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: /keywords covered/i })).not.toBeInTheDocument();
  });
});
