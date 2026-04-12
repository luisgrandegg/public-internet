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

- [x] Passes `/audit-component FileUpload`
- [x] Drag-and-drop zone with visible drop target styling
- [x] Fallback `<button>` that opens native file picker (keyboard-accessible)
- [x] Announces selected files via `aria-live` region
- [x] `error` displayed with `aria-describedby` wiring
- [x] Respects `accept` and `maxFiles` constraints
- [x] Storybook has ≥3 stories: single file, multiple files, error state
- [x] Axe accessibility test passes
- [x] Exported from `src/index.ts` barrel

## Notes

F-008 (PhotosStep) currently uses URL text inputs as a scaffold. This component replaces them when built. Actual storage/CDN integration is a separate concern — `FileUpload` delivers `File[]` to the caller.

## Needed by

F-008 (PhotosStep in create listing wizard)

---

## Completed

**Completed:** 2026-04-12
**PR:** [#4 — feat(design-system): add 6 DS components](https://github.com/luisgrandegg/public-internet/pull/4)
**Commit:** 2493b6d
**Audit:** All 5 checks pass — token audit, story completeness (3 stories), axe test, barrel export, CSS Modules only
**Notes:** Hidden `<input type="file">` with `tabIndex={-1}` and `aria-hidden`. User interacts via the browse `<button>`. `aria-live="polite"` region announces file count and names. `maxFiles` requires `multiple` prop to allow multi-file selection.
