import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, it, expect } from "vitest";
import { Card } from "./Card";

describe("Card", () => {
  it("renders children", () => {
    render(<Card>Content</Card>);
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("renders Header, Body, and Footer subcomponents", () => {
    render(
      <Card>
        <Card.Header>Header</Card.Header>
        <Card.Body>Body</Card.Body>
        <Card.Footer>Footer</Card.Footer>
      </Card>
    );
    expect(screen.getByText("Header")).toBeInTheDocument();
    expect(screen.getByText("Body")).toBeInTheDocument();
    expect(screen.getByText("Footer")).toBeInTheDocument();
  });

  it("renders each variant without error", () => {
    const variants = ["default", "elevated", "bordered"] as const;
    for (const variant of variants) {
      const { unmount } = render(<Card variant={variant}>Content</Card>);
      expect(screen.getByText("Content")).toBeInTheDocument();
      unmount();
    }
  });

  it("renders without subcomponents", () => {
    render(<Card>Simple content</Card>);
    expect(screen.getByText("Simple content")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <Card>
        <Card.Header>Title</Card.Header>
        <Card.Body>Content</Card.Body>
      </Card>
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
