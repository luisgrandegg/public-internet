import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, it, expect, vi } from "vitest";
import { Checkbox, CheckboxGroup } from "./Checkbox";

describe("Checkbox", () => {
  it("renders a checkbox element", () => {
    render(<Checkbox label="My label" />);
    expect(screen.getByRole("checkbox", { name: "My label" })).toBeInTheDocument();
  });

  it("label is accessible via htmlFor", () => {
    render(<Checkbox label="My label" />);
    expect(screen.getByLabelText("My label")).toBeInTheDocument();
  });

  it("is unchecked by default", () => {
    render(<Checkbox label="My label" />);
    expect(screen.getByRole("checkbox", { name: "My label" })).not.toBeChecked();
  });

  it("reflects checked state", () => {
    const handleChange = vi.fn();
    render(
      <Checkbox label="My label" checked={true} onChange={handleChange} />
    );
    expect(screen.getByRole("checkbox", { name: "My label" })).toBeChecked();
  });

  it("calls onChange when clicked", async () => {
    const handleChange = vi.fn();
    render(<Checkbox label="My label" onChange={handleChange} />);
    await userEvent.click(screen.getByRole("checkbox", { name: "My label" }));
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it("shows error message when error prop is set", () => {
    render(<Checkbox label="My label" error="This field is required." />);
    expect(screen.getByRole("alert")).toHaveTextContent("This field is required.");
  });

  it("sets aria-invalid when error is present", () => {
    render(<Checkbox label="My label" error="Required" />);
    expect(screen.getByRole("checkbox", { name: "My label" })).toHaveAttribute(
      "aria-invalid",
      "true"
    );
  });

  it("wires aria-describedby to the error message id", () => {
    render(<Checkbox label="My label" error="Required" />);
    const checkbox = screen.getByRole("checkbox", { name: "My label" });
    const errorId = checkbox.getAttribute("aria-describedby");
    expect(errorId).toBeTruthy();
    expect(document.getElementById(errorId!)).toHaveTextContent("Required");
  });

  it("does not set aria-invalid when no error", () => {
    render(<Checkbox label="My label" />);
    expect(
      screen.getByRole("checkbox", { name: "My label" })
    ).not.toHaveAttribute("aria-invalid");
  });

  it("forwards ref to the input element", () => {
    const ref = { current: null as HTMLInputElement | null };
    render(<Checkbox label="My label" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it("is disabled when disabled prop is set", () => {
    render(<Checkbox label="My label" disabled />);
    expect(screen.getByRole("checkbox", { name: "My label" })).toBeDisabled();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Checkbox label="Accept terms" />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no accessibility violations with error", async () => {
    const { container } = render(
      <Checkbox label="Accept terms" error="Required" />
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("CheckboxGroup", () => {
  const options = [
    { value: "wifi", label: "Wi-Fi" },
    { value: "pool", label: "Swimming pool" },
    { value: "parking", label: "Free parking" },
  ];

  it("renders a group (fieldset) with legend", () => {
    render(
      <CheckboxGroup
        legend="Amenities"
        options={options}
        value={[]}
        onChange={() => {}}
      />
    );
    const group = screen.getByRole("group", { name: "Amenities" });
    expect(group).toBeInTheDocument();
  });

  it("renders all options as checkboxes", () => {
    render(
      <CheckboxGroup
        legend="Amenities"
        options={options}
        value={[]}
        onChange={() => {}}
      />
    );
    const group = screen.getByRole("group", { name: "Amenities" });
    const checkboxes = within(group).getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(3);
  });

  it("checks the correct options based on value prop", () => {
    render(
      <CheckboxGroup
        legend="Amenities"
        options={options}
        value={["wifi", "parking"]}
        onChange={() => {}}
      />
    );
    expect(screen.getByRole("checkbox", { name: "Wi-Fi" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Swimming pool" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Free parking" })).toBeChecked();
  });

  it("calls onChange with added value when checking an option", async () => {
    const handleChange = vi.fn();
    render(
      <CheckboxGroup
        legend="Amenities"
        options={options}
        value={["wifi"]}
        onChange={handleChange}
      />
    );
    await userEvent.click(screen.getByRole("checkbox", { name: "Swimming pool" }));
    expect(handleChange).toHaveBeenCalledWith(["wifi", "pool"]);
  });

  it("calls onChange with removed value when unchecking an option", async () => {
    const handleChange = vi.fn();
    render(
      <CheckboxGroup
        legend="Amenities"
        options={options}
        value={["wifi", "pool"]}
        onChange={handleChange}
      />
    );
    await userEvent.click(screen.getByRole("checkbox", { name: "Wi-Fi" }));
    expect(handleChange).toHaveBeenCalledWith(["pool"]);
  });

  it("shows error message when error prop is set", () => {
    render(
      <CheckboxGroup
        legend="Amenities"
        options={options}
        value={[]}
        onChange={() => {}}
        error="Select at least one option."
      />
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Select at least one option."
    );
  });

  it("wires aria-describedby on fieldset to the error message", () => {
    render(
      <CheckboxGroup
        legend="Amenities"
        options={options}
        value={[]}
        onChange={() => {}}
        error="Required"
      />
    );
    const group = screen.getByRole("group", { name: "Amenities" });
    const errorId = group.getAttribute("aria-describedby");
    expect(errorId).toBeTruthy();
    expect(document.getElementById(errorId!)).toHaveTextContent("Required");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <CheckboxGroup
        legend="Amenities"
        options={options}
        value={["wifi"]}
        onChange={() => {}}
      />
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no accessibility violations with error", async () => {
    const { container } = render(
      <CheckboxGroup
        legend="Amenities"
        options={options}
        value={[]}
        onChange={() => {}}
        error="Select at least one option."
      />
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
