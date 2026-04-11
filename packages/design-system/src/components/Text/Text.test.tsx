import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, it, expect } from "vitest";
import { Text } from "./Text";

describe("Text", () => {
  it("renders body text as a paragraph", () => {
    render(<Text variant="body">Hello</Text>);
    expect(screen.getByText("Hello").tagName).toBe("P");
  });

  it("renders heading as h2 by default", () => {
    render(<Text variant="heading">Title</Text>);
    expect(screen.getByRole("heading", { level: 2, name: "Title" })).toBeInTheDocument();
  });

  it("renders heading at the specified level", () => {
    render(<Text variant="heading" level={1}>Main title</Text>);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("renders caption as a span", () => {
    render(<Text variant="caption">Small print</Text>);
    expect(screen.getByText("Small print").tagName).toBe("SPAN");
  });

  it("renders label as a label element", () => {
    render(<Text variant="label">Field label</Text>);
    expect(screen.getByText("Field label").tagName).toBe("LABEL");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <div>
        <Text variant="heading">Title</Text>
        <Text variant="body">Content</Text>
      </div>
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
