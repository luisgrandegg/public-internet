# /audit-component

Review an existing component against all lifecycle gates. Runs 5 automated checks first, then a full manual review. Produces a structured checklist with pass/fail/warn per check and offers auto-fixes for mechanical issues.

---

## What to do

### Step 1 — Identify the component

If `$ARGUMENTS` is provided, use it as the component name. Otherwise ask the user.

The component folder is at `packages/design-system/src/components/$ARGUMENTS/`.

Confirm the folder exists before proceeding. If it doesn't, tell the user and stop.

---

## Part A — Automated Checks (run these first, before any manual review)

Run all 5 checks and report results as a structured checklist. Use ✅ PASS, ❌ FAIL, or ⚠️ WARN for each.

### Check 1 — Token Audit

Search the component's `.module.css` file for design system convention violations:

```bash
# Hardcoded hex colors (should use var(--ds-color-*))
grep -n "#[0-9a-fA-F]\{3,6\}" packages/design-system/src/components/$ARGUMENTS/$ARGUMENTS.module.css

# Hardcoded px font sizes (should use var(--ds-font-size-*))
grep -n "font-size:\s*[0-9]\+px" packages/design-system/src/components/$ARGUMENTS/$ARGUMENTS.module.css

# Hardcoded font weights (should use var(--ds-font-weight-*))
grep -n "font-weight:\s*[0-9]\+" packages/design-system/src/components/$ARGUMENTS/$ARGUMENTS.module.css

# Hardcoded px spacing not on the 4px token scale (rough check)
grep -n ":\s*[0-9]*[13579]px\b" packages/design-system/src/components/$ARGUMENTS/$ARGUMENTS.module.css
```

Use the Grep tool to run each of these searches. Report each violation with its line number.

- ✅ PASS — no hardcoded values found
- ❌ FAIL — violations found (list each with line number and the offending value)

### Check 2 — Story Completeness

Check that the component has a `.stories.tsx` file with at least 3 named story exports:

1. Use Glob to confirm `packages/design-system/src/components/$ARGUMENTS/$ARGUMENTS.stories.tsx` exists.
2. Read the file and count named exports (lines matching `^export const \w+: Story`). There must be at least 3.

- ✅ PASS — file exists, 3+ named stories
- ❌ FAIL — file missing, OR fewer than 3 named stories (report the count found)

### Check 3 — Axe Test Presence

Check that the component's `.test.tsx` contains an accessibility test:

1. Use Glob to confirm `packages/design-system/src/components/$ARGUMENTS/$ARGUMENTS.test.tsx` exists.
2. Use Grep to search for `toHaveNoViolations` in the test file.

- ✅ PASS — `toHaveNoViolations()` found
- ❌ FAIL — test file missing, OR `toHaveNoViolations` not found

**Auto-fix available:** If the test file exists but is missing the axe test, offer to append the following test to the `describe` block:

```tsx
it('has no accessibility violations', async () => {
  const { container } = render(<$ARGUMENTS />)
  expect(await axe(container)).toHaveNoViolations()
})
```

Also check that `import { axe } from 'jest-axe'` is present at the top; add it if missing.

### Check 4 — Barrel Export

Check that the component is exported from the package barrel:

Use Grep to search for the component name in `packages/design-system/src/index.ts`:

- ✅ PASS — component found in barrel export
- ⚠️ WARN — not found (missing barrel export means consumers can't import the component)

**Auto-fix available:** If missing, offer to add the following line to `packages/design-system/src/index.ts`:

```ts
export { $ARGUMENTS, type ${ARGUMENTS}Props } from './components/$ARGUMENTS'
```

### Check 5 — CSS Modules Only

Check that the component `.tsx` file does not use inline `style` props:

Use Grep to search for `style={{` in the component's `.tsx` file (excluding `.stories.tsx`):

- ✅ PASS — no inline style props found
- ❌ FAIL — inline `style={{` found (list line numbers). These must be replaced with CSS Module classes using `var(--ds-*)` tokens.

---

### Automated Check Summary

After running all 5 checks, output a summary table:

```
## Automated Checks — $ARGUMENTS

| # | Check              | Result |
|---|--------------------|--------|
| 1 | Token audit        | ✅ / ❌ |
| 2 | Story completeness | ✅ / ❌ |
| 3 | Axe test presence  | ✅ / ❌ |
| 4 | Barrel export      | ✅ / ⚠️ |
| 5 | CSS Modules only   | ✅ / ❌ |

Overall: PASS / FAIL
```

If any check is ❌ FAIL, offer the auto-fix where available. For checks without an auto-fix, describe what needs to change.

**If the overall result is FAIL:** Tell the user: "These issues should be resolved before opening a PR. Would you like me to apply the available auto-fixes now?"

---

## Part B — Full Manual Audit

After the automated checks, continue with the full manual review below.

### Step 2 — Read all component files

Read each file in the component folder:

- `$ARGUMENTS.tsx`
- `$ARGUMENTS.module.css`
- `$ARGUMENTS.stories.tsx`
- `$ARGUMENTS.test.tsx`
- `index.ts`

### Step 3 — Audit against each gate

Check every item below and note pass ✅ or fail ❌:

**TypeScript**

- [ ] Named `Props` interface exported (`export interface ${ARGUMENTS}Props`)
- [ ] No `any` types
- [ ] All props have explicit types (no implicit `any`)
- [ ] Default values provided for all optional props

**Styling**

- [ ] CSS Modules used (`.module.css` import, `styles.className` usage)
- [ ] No inline `style={{}}` props
- [ ] No hardcoded hex values or raw px values outside the token scale
- [ ] No Tailwind utility classes
- [ ] All values reference `var(--ds-*)` tokens

**Stories**

- [ ] `.stories.tsx` file exists
- [ ] `title` follows `Components/$ARGUMENTS` pattern
- [ ] `tags: ['autodocs']` present
- [ ] At least 3 stories: default, variant, edge case (disabled/loading/error)
- [ ] `args` defined at meta level

**Tests**

- [ ] `.test.tsx` file exists
- [ ] Tests cover the component's main behaviours (rendering, interactions, edge cases)
- [ ] Tests use `screen` queries (`getByRole`, `getByText`, `getByLabelText`) — not `getByTestId`
- [ ] `userEvent` used for interactions, not `fireEvent`
- [ ] No implementation-detail assertions (no className checks, no internal state access)
- [ ] `pnpm --filter @public-internet/design-system test:coverage` passes with zero failures and ≥70% coverage

**Code quality**

- [ ] No `console.log` statements
- [ ] `className` prop accepted and applied for external overrides
- [ ] Component is exported from `index.ts` and from `src/index.ts` barrel

**Accessibility (basics)**

- [ ] Interactive elements use semantic HTML (`<button>`, `<input>`, not `<div onClick>`)
- [ ] `aria-label` or visible label present where needed
- [ ] Disabled state handled correctly (not just visually)

### Step 4 — Fix automatically where possible

For any ❌ items that have a clear, mechanical fix (missing export, console.log, inline style), fix them directly using Edit.

For items that require design decisions (missing story variants, accessibility semantics), describe the issue clearly and suggest the fix but ask the user before applying.

**If the test file is missing:** propose a test plan (see `/new-component` Step 6 format) and wait for user approval before writing it.

### Step 5 — Re-run gates

After fixes:

```bash
pnpm typecheck
pnpm lint
pnpm --filter @public-internet/design-system test:coverage
```

Report the final result.

### Step 6 — Final Summary

Give the user a final report:

- Automated checks: X/5 passed
- Manual audit: how many issues found, auto-fixed, need input
- Whether the component now passes all lifecycle gates
- Reminder: **a component that fails the audit should not be merged. Resolve all ❌ FAIL items before running `/create-pr`.**
