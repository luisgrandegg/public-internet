# F-013 — DS: FileUpload component

## Summary

A `FileUpload` component for attaching files (initially photos for listing creation). Renders a drag-and-drop zone with a fallback click-to-browse button. Accessible: keyboard-operable, announces file selection to screen readers.

## Props interface (proposed)

```tsx
export interface FileUploadProps {
  label: string
  accept?: string         // e.g. "image/*"
  multiple?: boolean
  maxFiles?: number
  onFilesChange: (files: File[]) => void
  error?: string
}
```

## Acceptance criteria

- [ ] Passes `/audit-component FileUpload`
- [ ] Drag-and-drop zone with visible drop target styling
- [ ] Fallback `<button>` that opens native file picker (keyboard-accessible)
- [ ] Announces selected files via `aria-live` region
- [ ] `error` displayed with `aria-describedby` wiring
- [ ] Respects `accept` and `maxFiles` constraints
- [ ] Storybook has ≥3 stories: single file, multiple files, error state
- [ ] Axe accessibility test passes
- [ ] Exported from `src/index.ts` barrel

## Notes

F-008 (PhotosStep) currently uses URL text inputs as a scaffold. This component replaces them when built. Actual storage/CDN integration is a separate concern — `FileUpload` delivers `File[]` to the caller.

## Needed by

F-008 (PhotosStep in create listing wizard)

## Status

Planned — gap identified during F-008 planning.
