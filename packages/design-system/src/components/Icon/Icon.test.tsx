import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, it, expect } from "vitest";
import { Icon, type IconName } from "./Icon";

const allIconNames: IconName[] = [
  "home", "search", "user", "menu", "close", "check",
  "star", "map-pin", "clock", "chevron-right", "chevron-down",
  "arrow-right", "alert-circle",
];

describe("Icon", () => {
  it("renders an SVG element", () => {
    const { container } = render(<Icon name="home" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("is hidden from assistive technology when no label is provided", () => {
    const { container } = render(<Icon name="home" />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("is accessible when a label is provided", () => {
    render(<Icon name="home" label="Home" />);
    expect(screen.getByRole("img", { name: "Home" })).toBeInTheDocument();
  });

  it("renders all icon names without error", () => {
    for (const name of allIconNames) {
      const { unmount } = render(<Icon name={name} />);
      unmount();
    }
  });

  it("has no accessibility violations when decorative", async () => {
    const { container } = render(<Icon name="check" />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no accessibility violations when labelled", async () => {
    const { container } = render(<Icon name="check" label="Confirmed" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
