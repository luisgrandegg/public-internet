import type { Meta, StoryObj } from "@storybook/react";
import { Divider } from "./Divider";
import { Stack } from "../Stack/Stack";
import { Text } from "../Text/Text";

const meta = {
  title: "Components/Divider",
  component: Divider,
  tags: ["autodocs"],
} satisfies Meta<typeof Divider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const BetweenContent: Story = {
  render: () => (
    <Stack gap={4}>
      <Text variant="body">Section one</Text>
      <Divider />
      <Text variant="body">Section two</Text>
      <Divider />
      <Text variant="body">Section three</Text>
    </Stack>
  ),
};

export const WithCaption: Story = {
  render: () => (
    <Stack gap={3}>
      <Text variant="body">Primary content above</Text>
      <Divider />
      <Text variant="caption">Supporting detail below</Text>
    </Stack>
  ),
};
