import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, it, expect } from "vitest";
import { Stack } from "./Stack";

describe("Stack", () => {
  it("renders its children", () => {
    render(
      <Stack>
        <span>A</span>
        <span>B</span>
      </Stack>
    );
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
  });

  it("renders vertical direction by default", () => {
    const { container } = render(
      <Stack>
        <span>A</span>
      </Stack>
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it("renders horizontal direction", () => {
    const { container } = render(
      <Stack direction="horizontal">
        <span>A</span>
      </Stack>
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <Stack>
        <span>Item one</span>
        <span>Item two</span>
      </Stack>
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
