import type { Meta, StoryObj } from "@storybook/react";
import { Stack } from "./Stack";
import { Button } from "../Button/Button";
import { Badge } from "../Badge/Badge";

const meta = {
  title: "Components/Stack",
  component: Stack,
  tags: ["autodocs"],
  args: {
    // children are provided by each story's render function
    children: null,
  },
} satisfies Meta<typeof Stack>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Vertical: Story = {
  render: () => (
    <Stack direction="vertical" gap={4}>
      <Button>First</Button>
      <Button variant="secondary">Second</Button>
      <Button variant="ghost">Third</Button>
    </Stack>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <Stack direction="horizontal" gap={2}>
      <Badge variant="success">Active</Badge>
      <Badge variant="warning">Pending</Badge>
      <Badge variant="danger">Rejected</Badge>
    </Stack>
  ),
};

export const HorizontalCentered: Story = {
  render: () => (
    <Stack direction="horizontal" gap={4} align="center">
      <Button size="lg">Large</Button>
      <Button size="md">Medium</Button>
      <Button size="sm">Small</Button>
    </Stack>
  ),
};
