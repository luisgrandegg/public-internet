import type { Meta, StoryObj } from "@storybook/react";
import { Textarea } from "./Textarea";

const meta = {
  title: "Components/Textarea",
  component: Textarea,
  tags: ["autodocs"],
  args: { placeholder: "Enter your message…" },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithLabel: Story = {
  args: { label: "Message" },
};

export const WithError: Story = {
  args: {
    label: "Message",
    defaultValue: "Too short",
    error: "Message must be at least 20 characters.",
  },
};

export const Disabled: Story = {
  args: {
    label: "Message",
    disabled: true,
    defaultValue: "This field is disabled.",
  },
};
