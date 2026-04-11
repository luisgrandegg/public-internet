# /ab-variant

Create an A/B experiment variant of an existing design system component. The variant lives in `src/experiments/` and is never exported from `index.ts`.

---

## What to do

### Step 1 — Gather requirements

Ask the user for:

1. **Base component** — which existing component to variant (e.g. `Button`, `Card`)
2. **What to change** — the specific visual or behavioural difference (e.g. pill-shaped border radius, larger padding, icon-only)
3. **Hypothesis** — why this change might improve the experience (e.g. "pill buttons may increase CTA click-through on checkout")

If already provided in the message, skip asking.

### Step 2 — Read the base component

Read the source files of the base component from `packages/design-system/src/components/<Component>/` to understand the current implementation before making changes.

### Step 3 — Create the experiment files

Create 3 files in `packages/design-system/src/experiments/<ComponentName>Variant/`:

**`<ComponentName>Variant.tsx`**

- Copy the base component's structure
- Apply only the specific change described — do not refactor unrelated code
- Keep the same Props interface (or extend it minimally)
- No `any` types

**`<ComponentName>Variant.module.css`**

- Import and extend base styles where possible
- Only change what the hypothesis requires

**`<ComponentName>Variant.stories.tsx`**

```tsx
export default {
  title: 'Experiments/<ComponentName>Variant',
  tags: ['experiment'],
  parameters: {
    docs: {
      description: {
        component: `
**Hypothesis:** <what the user described>
**Changed:** <specific diff from base>
**Status:** 🔲 Testing
        `,
      },
    },
  },
}
```

Include at least 2 stories: the default state and the key variant state.

### Step 4 — Verify isolation

Confirm that:

- Nothing in `packages/design-system/src/index.ts` imports from `src/experiments/`
- The experiment component is not used anywhere in `apps/`

### Step 5 — Verify

```bash
pnpm typecheck
pnpm lint
```

Fix any errors before finishing.

### Step 6 — Confirm to the user

Tell the user:

- The experiment is at `packages/design-system/src/experiments/<ComponentName>Variant/`
- It's visible in Storybook under `Experiments/` — start Storybook to preview it
- It will never be shipped to production unless explicitly promoted to `src/components/`
- Suggest running `/create-pr` when ready to share for review
