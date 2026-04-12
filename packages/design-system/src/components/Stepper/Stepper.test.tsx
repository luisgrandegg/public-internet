import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, it, expect } from "vitest";
import { Stepper } from "./Stepper";

describe("Stepper", () => {
  const steps = [
    { label: "Step 1" },
    { label: "Step 2" },
    { label: "Step 3" },
  ];

  it("renders all step labels", () => {
    render(<Stepper steps={steps} currentStep={0} />);
    expect(screen.getByText("Step 1")).toBeInTheDocument();
    expect(screen.getByText("Step 2")).toBeInTheDocument();
    expect(screen.getByText("Step 3")).toBeInTheDocument();
  });

  it("marks current step with aria-current=\"step\"", () => {
    render(<Stepper steps={steps} currentStep={1} />);
    const items = screen.getAllByRole("listitem");
    expect(items[1]).toHaveAttribute("aria-current", "step");
    expect(items[0]).not.toHaveAttribute("aria-current");
    expect(items[2]).not.toHaveAttribute("aria-current");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Stepper steps={steps} currentStep={0} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
