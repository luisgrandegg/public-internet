# /new-component

Scaffold a new design system component from a description. Produces all required files and passes lifecycle gates.

---

## What to do

### Step 1 — Gather requirements

Ask the user for:

1. **Component name** (PascalCase, e.g. `Toast`, `ProgressBar`)
2. **What it does** — one sentence description
3. **Variants needed** — list the visual variants (e.g. `success | warning | danger`)
4. **Props** — any specific props beyond variants (size, disabled, children, etc.)

If the user has already provided these in their message, skip asking.

### Step 2 — Check for existing components

Before creating anything, check `packages/design-system/src/components/` for a similar component. If one exists, suggest extending it rather than creating a new one.

Also check if the use case can be composed from existing components (`Button`, `Card`, `Badge`, `Text`, `Stack`, `Icon`, `Input`, `Divider`). If it can, suggest composition and stop.

### Step 3 — Scaffold the files

Create 4 files in `packages/design-system/src/components/<ComponentName>/`:

**`<ComponentName>.tsx`**

- Named `Props` interface (`export interface <ComponentName>Props`)
- No `any` types
- Default values for all optional props
- `className` prop for external overrides
- Uses only design tokens via CSS variable references

**`<ComponentName>.module.css`**

- `.root` as the base class
- One class per variant
- Only `var(--ds-*)` tokens — no hardcoded hex, px values outside the token scale, or Tailwind

**`<ComponentName>.stories.tsx`**

- `title: 'Components/<ComponentName>'`
- `tags: ['autodocs']`
- Minimum 3 stories: default, at least one variant, disabled/edge case
- `args` set at meta level for shared defaults
- For interactive components (buttons, inputs, toggles): add `play` functions to stories that test click/type/focus behaviour using `userEvent` and `expect` from `@storybook/test`
- For display-only components (badges, text, cards): `play` functions are optional — only add them if there is a meaningful interaction to verify

**`index.ts`**

```ts
export { <ComponentName> } from './<ComponentName>'
export type { <ComponentName>Props } from './<ComponentName>'
```

### Step 4 — Update the barrel export

Add the new component to `packages/design-system/src/index.ts`:

```ts
export { <ComponentName>, type <ComponentName>Props } from './components/<ComponentName>'
```

### Step 5 — Update CLAUDE.md component table

Add a row to the Available Components table in `packages/design-system/CLAUDE.md`.

### Step 6 — Propose a test plan

Before writing any tests, propose a test plan and **wait for the user to approve it**.

The plan must cover component behaviour from the user's perspective — what they see, what they can interact with, what changes as a result. Never test implementation details (internal state, refs, class names, prop forwarding).

Structure the plan as a numbered list:

```
Test plan for <ComponentName>:

1. Renders with default props — [what should be visible]
2. Renders each variant — [what visual/semantic difference is observable]
3. [Key interaction] — [what the user does and what changes]
4. Disabled state — [what is blocked or communicated to the user]
5. Accessibility — [role, label, keyboard behaviour]
```

Present this list and ask: **"Does this test plan look right? Any behaviours to add or remove?"**

Do not create the test file until the user confirms.

### Step 7 — Write the test file

After approval, create `<ComponentName>.test.tsx` in the component folder:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { <ComponentName> } from './<ComponentName>'

describe('<ComponentName>', () => {
  // tests here
})
```

**Rules for every test:**

- Use `screen` queries that reflect what a user sees (`getByRole`, `getByText`, `getByLabelText`) — not `getByTestId` unless no semantic query fits
- Use `userEvent` for interactions, not `fireEvent`
- One behaviour per `it` block
- Assert on outcomes the user observes: visible text, role, aria state, not className or internal state

### Step 8 — Verify

Run:

```bash
pnpm typecheck
pnpm lint
pnpm --filter @public-internet/design-system test:coverage
```

All three must pass. Coverage must be ≥70% on lines, functions, branches, and statements. Fix any failures before finishing.

### Step 9 — Run the AI Quality Gate audit

Run `/audit-component <ComponentName>` to validate the scaffolded component passes all automated quality checks:

1. Token audit (no hardcoded hex/px/font values)
2. Story completeness (≥3 named stories)
3. Axe test presence (`toHaveNoViolations`)
4. Barrel export (exported from `src/index.ts`)
5. CSS Modules only (no `style={{` inline props)

Apply any auto-fixes offered and resolve all ❌ FAIL items before proceeding.

### Step 10 — Confirm to the user

Tell the user:

- The component is ready at `packages/design-system/src/components/<ComponentName>/`
- They can preview it in Storybook at `http://localhost:6006`
- The quality gate audit has been run (report the result)
- Remind them to run `/create-pr` when they're happy with the result
