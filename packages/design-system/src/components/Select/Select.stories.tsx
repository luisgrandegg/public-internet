import type { Meta, StoryObj } from "@storybook/react";
import { Select } from "./Select";

const OPTIONS = [
  { value: "flat", label: "Flat" },
  { value: "house", label: "House" },
  { value: "room", label: "Room" },
  { value: "studio", label: "Studio" },
];

const meta = {
  title: "Components/Select",
  component: Select,
  tags: ["autodocs"],
  args: { options: OPTIONS, value: "", onChange: () => {} },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithPlaceholder: Story = {
  args: { label: "Property type", placeholder: "Select a type" },
};

export const WithValue: Story = {
  args: { label: "Property type", value: "flat" },
};

export const WithError: Story = {
  args: { label: "Property type", value: "", error: "Please select a type." },
};

export const Disabled: Story = {
  args: { label: "Property type", value: "flat", disabled: true },
};
