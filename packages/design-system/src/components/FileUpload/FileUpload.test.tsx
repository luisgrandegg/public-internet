import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, it, expect, vi } from "vitest";
import { FileUpload } from "./FileUpload";

describe("FileUpload", () => {
  it("renders the drop zone", () => {
    render(<FileUpload label="Upload files" onFilesChange={() => {}} />);
    expect(screen.getByText(/drag and drop files here/i)).toBeInTheDocument();
  });

  it("renders the visible label", () => {
    render(<FileUpload label="Upload photos" onFilesChange={() => {}} />);
    expect(screen.getByText("Upload photos")).toBeInTheDocument();
  });

  it("renders the browse button with accessible role", () => {
    render(<FileUpload label="Upload" onFilesChange={() => {}} />);
    expect(
      screen.getByRole("button", { name: /browse/i })
    ).toBeInTheDocument();
  });

  it("calls onFilesChange when files are selected via input", async () => {
    const onFilesChange = vi.fn();
    const { container } = render(
      <FileUpload label="Upload" onFilesChange={onFilesChange} />
    );

    const input = container.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const file = new File(["content"], "test.jpg", { type: "image/jpeg" });

    await userEvent.upload(input, file);
    expect(onFilesChange).toHaveBeenCalledWith([file]);
  });

  it("respects maxFiles constraint", async () => {
    const onFilesChange = vi.fn();
    const { container } = render(
      <FileUpload label="Upload" onFilesChange={onFilesChange} maxFiles={2} multiple />
    );

    const input = container.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const files = [
      new File(["a"], "a.jpg", { type: "image/jpeg" }),
      new File(["b"], "b.jpg", { type: "image/jpeg" }),
      new File(["c"], "c.jpg", { type: "image/jpeg" }),
    ];

    await userEvent.upload(input, files);
    expect(onFilesChange).toHaveBeenCalledWith([files[0], files[1]]);
  });

  it("shows selected file names after selection", async () => {
    const { container } = render(
      <FileUpload label="Upload" onFilesChange={() => {}} />
    );

    const input = container.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const file = new File(["content"], "photo.png", { type: "image/png" });

    await userEvent.upload(input, file);
    expect(screen.getByText("photo.png")).toBeInTheDocument();
  });

  it("shows error message when error prop is set", () => {
    render(
      <FileUpload
        label="Upload"
        onFilesChange={() => {}}
        error="File is required"
      />
    );
    expect(screen.getByRole("alert")).toHaveTextContent("File is required");
  });

  it("renders accept hint when accept prop is provided", () => {
    render(
      <FileUpload label="Upload" onFilesChange={() => {}} accept="image/*" />
    );
    expect(screen.getByText(/Accepted: image\/\*/)).toBeInTheDocument();
  });

  it("renders maxFiles hint when maxFiles prop is provided", () => {
    render(
      <FileUpload label="Upload" onFilesChange={() => {}} maxFiles={3} />
    );
    expect(screen.getByText(/Max 3 files/)).toBeInTheDocument();
  });

  it("renders aria-live region for screen reader announcements", () => {
    render(<FileUpload label="Upload" onFilesChange={() => {}} />);
    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <FileUpload label="Upload photos" onFilesChange={() => {}} />
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no accessibility violations in error state", async () => {
    const { container } = render(
      <FileUpload
        label="Upload photos"
        onFilesChange={() => {}}
        error="File is required"
      />
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
