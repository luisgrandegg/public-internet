import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Checkbox, CheckboxGroup } from "./Checkbox";

const meta = {
  title: "Components/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleUnchecked: Story = {
  args: {
    label: "Accept terms and conditions",
  },
};

export const SingleChecked: Story = {
  args: {
    label: "Accept terms and conditions",
    defaultChecked: true,
    onChange: () => {},
  },
};

export const SingleWithError: Story = {
  args: {
    label: "Accept terms and conditions",
    error: "You must accept the terms to continue.",
  },
};

export const SingleDisabled: Story = {
  args: {
    label: "Disabled option",
    disabled: true,
  },
};

export const Group: StoryObj = {
  render: function GroupStory() {
    const [selected, setSelected] = React.useState(["wifi"]);
    return (
      <CheckboxGroup
        legend="Amenities"
        options={[
          { value: "wifi", label: "Wi-Fi" },
          { value: "pool", label: "Swimming pool" },
          { value: "parking", label: "Free parking" },
          { value: "breakfast", label: "Breakfast included" },
        ]}
        value={selected}
        onChange={setSelected}
      />
    );
  },
};

export const GroupWithError: StoryObj = {
  render: function GroupWithErrorStory() {
    const [selected, setSelected] = React.useState<string[]>([]);
    return (
      <CheckboxGroup
        legend="Amenities"
        options={[
          { value: "wifi", label: "Wi-Fi" },
          { value: "pool", label: "Swimming pool" },
          { value: "parking", label: "Free parking" },
        ]}
        value={selected}
        onChange={setSelected}
        error="Please select at least one amenity."
      />
    );
  },
};
