import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "./Card";
import { Button } from "../Button/Button";

const meta = {
  title: "Components/Card",
  component: Card,
  tags: ["autodocs"],
  args: {
    // children are provided by each story's render function
    children: null,
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card variant="default">
      <Card.Header>Card title</Card.Header>
      <Card.Body>This is the card body content.</Card.Body>
      <Card.Footer>
        <Button variant="ghost" size="sm">Cancel</Button>
        <Button variant="primary" size="sm">Confirm</Button>
      </Card.Footer>
    </Card>
  ),
};

export const Elevated: Story = {
  render: () => (
    <Card variant="elevated">
      <Card.Header>Elevated card</Card.Header>
      <Card.Body>Uses a shadow instead of a border.</Card.Body>
    </Card>
  ),
};

export const Bordered: Story = {
  render: () => (
    <Card variant="bordered">
      <Card.Header>Bordered card</Card.Header>
      <Card.Body>Uses a thicker border for more emphasis.</Card.Body>
    </Card>
  ),
};

export const BodyOnly: Story = {
  render: () => (
    <Card>
      <Card.Body>A card with only a body — no header or footer required.</Card.Body>
    </Card>
  ),
};
