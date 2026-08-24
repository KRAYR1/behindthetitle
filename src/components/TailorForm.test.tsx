import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TailorForm } from "./TailorForm";

function setup(overrides: Partial<React.ComponentProps<typeof TailorForm>> = {}) {
  const props = {
    jobText: "",
    resumeText: "",
    tone: "impact" as const,
    pending: false,
    error: null,
    onJobChange: vi.fn(),
    onResumeChange: vi.fn(),
    onToneChange: vi.fn(),
    onSubmit: vi.fn(),
    ...overrides,
  };
  render(<TailorForm {...props} />);
  return props;
}

describe("TailorForm", () => {
  it("labels both text areas for screen readers", () => {
    setup();
    expect(screen.getByLabelText(/job description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/your resume bullets/i)).toBeInTheDocument();
  });

  it("submits when the button is pressed", async () => {
    const props = setup();
    await userEvent.click(screen.getByRole("button", { name: /tailor my application/i }));
    expect(props.onSubmit).toHaveBeenCalledTimes(1);
  });

  it("reports typing back to the parent", async () => {
    const props = setup();
    await userEvent.type(screen.getByLabelText(/job description/i), "R");
    expect(props.onJobChange).toHaveBeenCalledWith("R");
  });

  it("changes tone via the radio group", async () => {
    const props = setup();
    await userEvent.click(screen.getByRole("radio", { name: /technical/i }));
    expect(props.onToneChange).toHaveBeenCalledWith("technical");
  });

  it("disables the button and announces progress while pending", () => {
    setup({ pending: true });
    expect(screen.getByRole("button", { name: /tailoring/i })).toBeDisabled();
  });

  it("shows errors in an alert region", () => {
    setup({ error: "Job description is too short." });
    expect(screen.getByRole("alert")).toHaveTextContent(/too short/i);
  });
});
