import type { Meta, StoryObj } from "@storybook/react";
import { FileUpload } from "./FileUpload";

const meta = {
  title: "Components/FileUpload",
  component: FileUpload,
  tags: ["autodocs"],
  args: {
    label: "Upload photos",
    onFilesChange: () => {},
  },
} satisfies Meta<typeof FileUpload>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleFile: Story = { args: { label: "Upload a document" } };
export const MultipleFiles: Story = {
  args: {
    label: "Upload photos",
    accept: "image/*",
    multiple: true,
    maxFiles: 5,
  },
};
export const WithError: Story = {
  args: {
    label: "Upload photos",
    error: "Please upload at least one photo.",
  },
};
