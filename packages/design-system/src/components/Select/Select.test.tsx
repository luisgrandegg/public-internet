import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, it, expect, vi } from "vitest";
import { Select } from "./Select";

const OPTIONS = [
  { value: "flat", label: "Flat" },
  { value: "house", label: "House" },
  { value: "room", label: "Room" },
];

describe("Select", () => {
  it("renders a select element", () => {
    render(<Select options={OPTIONS} value="" onChange={() => {}} />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("renders a label when provided", () => {
    render(<Select label="Property type" options={OPTIONS} value="" onChange={() => {}} />);
    expect(screen.getByLabelText("Property type")).toBeInTheDocument();
  });

  it("renders all options", () => {
    render(<Select options={OPTIONS} value="" onChange={() => {}} />);
    expect(screen.getByRole("option", { name: "Flat" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "House" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Room" })).toBeInTheDocument();
  });

  it("renders a placeholder option when provided", () => {
    render(
      <Select options={OPTIONS} value="" onChange={() => {}} placeholder="Select a type" />
    );
    const placeholderOption = screen.getByRole("option", { name: "Select a type" });
    expect(placeholderOption).toBeInTheDocument();
    expect(placeholderOption).toBeDisabled();
  });

  it("reflects the current value", () => {
    render(<Select options={OPTIONS} value="house" onChange={() => {}} />);
    expect(screen.getByRole("combobox")).toHaveValue("house");
  });

  it("calls onChange with the string value when selection changes", async () => {
    const handleChange = vi.fn();
    render(<Select options={OPTIONS} value="" onChange={handleChange} />);
    await userEvent.selectOptions(screen.getByRole("combobox"), "flat");
    expect(handleChange).toHaveBeenCalledWith("flat");
  });

  it("shows error message when error prop is set", () => {
    render(
      <Select options={OPTIONS} value="" onChange={() => {}} error="Please select a type." />
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Please select a type.");
  });

  it("marks select as invalid when error is set", () => {
    render(<Select options={OPTIONS} value="" onChange={() => {}} error="Required" />);
    expect(screen.getByRole("combobox")).toHaveAttribute("aria-invalid", "true");
  });

  it("wires aria-describedby to the error message", () => {
    render(<Select options={OPTIONS} value="" onChange={() => {}} error="Required" />);
    const select = screen.getByRole("combobox");
    const errorId = select.getAttribute("aria-describedby");
    expect(errorId).toBeTruthy();
    expect(document.getElementById(errorId!)).toHaveTextContent("Required");
  });

  it("is disabled when disabled prop is set", () => {
    render(<Select options={OPTIONS} value="" onChange={() => {}} disabled />);
    expect(screen.getByRole("combobox")).toBeDisabled();
  });

  it("forwards ref to the select element", () => {
    const ref = { current: null as HTMLSelectElement | null };
    render(<Select options={OPTIONS} value="" onChange={() => {}} ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLSelectElement);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <Select label="Property type" options={OPTIONS} value="flat" onChange={() => {}} />
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
