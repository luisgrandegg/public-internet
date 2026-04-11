import type { Meta, StoryObj } from "@storybook/react";
import { Icon, type IconName } from "./Icon";
import { Stack } from "../Stack/Stack";

const meta = {
  title: "Components/Icon",
  component: Icon,
  tags: ["autodocs"],
  args: { name: "home" },
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { name: "home" } };
export const Small: Story = { args: { name: "check", size: "sm" } };
export const Large: Story = { args: { name: "search", size: "lg" } };
export const WithLabel: Story = {
  args: { name: "star", label: "Favourited" },
};

const allIconNames: IconName[] = [
  "home", "search", "user", "menu", "close", "check",
  "star", "map-pin", "clock", "chevron-right", "chevron-down",
  "arrow-right", "alert-circle",
];

export const AllIcons: Story = {
  render: () => (
    <Stack direction="horizontal" gap={4} align="center">
      {allIconNames.map((name) => (
        <Icon key={name} name={name} />
      ))}
    </Stack>
  ),
};
