import type { Meta, StoryObj } from "@storybook/react";
import { Stepper } from "./Stepper";

const STEPS = [
  { label: "Property type", description: "What kind of property?" },
  { label: "Location", description: "Where is it?" },
  { label: "Description", description: "Tell guests about it" },
  { label: "Photos", description: "Show it off" },
];

const meta = {
  title: "Components/Stepper",
  component: Stepper,
  tags: ["autodocs"],
  args: { steps: STEPS },
} satisfies Meta<typeof Stepper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FirstStep: Story = { args: { currentStep: 0 } };
export const MiddleStep: Story = { args: { currentStep: 2 } };
export const FinalStep: Story = { args: { currentStep: 3 } };
export const Vertical: Story = { args: { currentStep: 1, orientation: "vertical" } };
