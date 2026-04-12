import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, it, expect } from "vitest";
import { Textarea } from "./Textarea";

describe("Textarea", () => {
  it("renders a textarea element", () => {
    render(<Textarea />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("renders a label when provided", () => {
    render(<Textarea label="Message" />);
    expect(screen.getByLabelText("Message")).toBeInTheDocument();
  });

  it("shows error message when error prop is set", () => {
    render(<Textarea label="Message" error="Required field" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Required field");
  });

  it("marks textarea as invalid when error is set", () => {
    render(<Textarea label="Message" error="Required" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
  });

  it("is disabled when disabled prop is set", () => {
    render(<Textarea disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("defaults to 4 rows", () => {
    render(<Textarea />);
    expect(screen.getByRole("textbox")).toHaveAttribute("rows", "4");
  });

  it("respects custom rows prop", () => {
    render(<Textarea rows={8} />);
    expect(screen.getByRole("textbox")).toHaveAttribute("rows", "8");
  });

  it("forwards ref to the textarea element", () => {
    const ref = { current: null as HTMLTextAreaElement | null };
    render(<Textarea ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Textarea label="Message" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
