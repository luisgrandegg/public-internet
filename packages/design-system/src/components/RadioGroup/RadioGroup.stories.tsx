import type { Meta, StoryObj } from "@storybook/react";
import { RadioGroup } from "./RadioGroup";

const PROPERTY_TYPES = [
  { value: "flat", label: "Flat", description: "An apartment or flat" },
  { value: "house", label: "House", description: "A whole house" },
  { value: "room", label: "Room", description: "A private room" },
  { value: "studio", label: "Studio", description: "A studio apartment" },
];

const meta = {
  title: "Components/RadioGroup",
  component: RadioGroup,
  tags: ["autodocs"],
  args: {
    legend: "Property type",
    name: "type",
    options: PROPERTY_TYPES,
    value: "flat",
    onChange: () => {},
  },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Vertical: Story = {
  args: {
    legend: "Property type",
    name: "type",
    options: PROPERTY_TYPES,
    value: "flat",
    layout: "vertical",
  },
};

export const Grid: Story = {
  args: {
    legend: "Property type",
    name: "type-grid",
    options: PROPERTY_TYPES,
    value: "house",
    layout: "grid",
  },
};

export const WithError: Story = {
  args: {
    legend: "Property type",
    name: "type-err",
    options: PROPERTY_TYPES,
    value: "",
    error: "Please select a property type.",
    layout: "vertical",
  },
};
