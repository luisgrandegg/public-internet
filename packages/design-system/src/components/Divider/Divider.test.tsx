import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, it, expect } from "vitest";
import { Divider } from "./Divider";

describe("Divider", () => {
  it("renders a separator element", () => {
    render(<Divider />);
    expect(screen.getByRole("separator")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Divider />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
