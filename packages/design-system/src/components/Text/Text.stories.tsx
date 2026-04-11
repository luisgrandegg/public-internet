import type { Meta, StoryObj } from "@storybook/react";
import { Text } from "./Text";

const meta = {
  title: "Components/Text",
  component: Text,
  tags: ["autodocs"],
  args: { children: "The quick brown fox jumps over the lazy dog" },
} satisfies Meta<typeof Text>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Heading: Story = { args: { variant: "heading", children: "Page heading" } };
export const Body: Story = { args: { variant: "body" } };
export const Caption: Story = { args: { variant: "caption" } };
export const Label: Story = { args: { variant: "label", children: "Field label" } };
export const HeadingH1: Story = {
  args: { variant: "heading", level: 1, children: "H1 — Main page title" },
};
