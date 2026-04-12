import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, it, expect, vi } from "vitest";
import { RadioGroup } from "./RadioGroup";

const OPTIONS = [
  { value: "flat", label: "Flat", description: "An apartment or flat" },
  { value: "house", label: "House", description: "A whole house" },
  { value: "room", label: "Room", description: "A private room" },
];

describe("RadioGroup", () => {
  it("renders a fieldset group", () => {
    render(
      <RadioGroup
        legend="Property type"
        name="type"
        options={OPTIONS}
        value="flat"
        onChange={() => {}}
      />
    );
    expect(screen.getByRole("group", { name: "Property type" })).toBeInTheDocument();
  });

  it("renders all radio options", () => {
    render(
      <RadioGroup
        legend="Property type"
        name="type"
        options={OPTIONS}
        value="flat"
        onChange={() => {}}
      />
    );
    expect(screen.getByRole("radio", { name: /Flat/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /House/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Room/i })).toBeInTheDocument();
  });

  it("marks the correct option as checked", () => {
    render(
      <RadioGroup
        legend="Property type"
        name="type"
        options={OPTIONS}
        value="house"
        onChange={() => {}}
      />
    );
    expect(screen.getByRole("radio", { name: /House/i })).toBeChecked();
    expect(screen.getByRole("radio", { name: /Flat/i })).not.toBeChecked();
  });

  it("calls onChange with the selected value when a radio is clicked", async () => {
    const handleChange = vi.fn();
    render(
      <RadioGroup
        legend="Property type"
        name="type"
        options={OPTIONS}
        value="flat"
        onChange={handleChange}
      />
    );
    await userEvent.click(screen.getByRole("radio", { name: /House/i }));
    expect(handleChange).toHaveBeenCalledWith("house");
  });

  it("renders descriptions as secondary text", () => {
    render(
      <RadioGroup
        legend="Property type"
        name="type"
        options={OPTIONS}
        value="flat"
        onChange={() => {}}
      />
    );
    expect(screen.getByText("An apartment or flat")).toBeInTheDocument();
    expect(screen.getByText("A whole house")).toBeInTheDocument();
  });

  it("shows error message when error prop is set", () => {
    render(
      <RadioGroup
        legend="Property type"
        name="type"
        options={OPTIONS}
        value=""
        onChange={() => {}}
        error="Please select a property type."
      />
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Please select a property type."
    );
  });

  it("wires aria-describedby on fieldset to the error message", () => {
    render(
      <RadioGroup
        legend="Property type"
        name="type"
        options={OPTIONS}
        value=""
        onChange={() => {}}
        error="Required"
      />
    );
    const group = screen.getByRole("group");
    const errorId = group.getAttribute("aria-describedby");
    expect(errorId).toBeTruthy();
    expect(document.getElementById(errorId!)).toHaveTextContent("Required");
  });

  it("does not render aria-describedby when no error", () => {
    render(
      <RadioGroup
        legend="Property type"
        name="type"
        options={OPTIONS}
        value="flat"
        onChange={() => {}}
      />
    );
    expect(
      screen.getByRole("group").getAttribute("aria-describedby")
    ).toBeNull();
  });

  it("has no accessibility violations (vertical layout)", async () => {
    const { container } = render(
      <RadioGroup
        legend="Property type"
        name="type"
        options={OPTIONS}
        value="flat"
        onChange={() => {}}
        layout="vertical"
      />
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no accessibility violations (grid layout)", async () => {
    const { container } = render(
      <RadioGroup
        legend="Property type"
        name="type-grid"
        options={OPTIONS}
        value="flat"
        onChange={() => {}}
        layout="grid"
      />
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no accessibility violations (with error)", async () => {
    const { container } = render(
      <RadioGroup
        legend="Property type"
        name="type-err"
        options={OPTIONS}
        value=""
        onChange={() => {}}
        error="Please select a property type."
      />
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
