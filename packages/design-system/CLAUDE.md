# CLAUDE.md — Design System Package

> Rules scoped to `packages/design-system/`. The root `CLAUDE.md` applies globally on top of these.

---

## Design Tokens

Always use these tokens. **Never invent hex values or hardcode spacing.**

### Colors

```css
--ds-color-brand-primary: #635bff;
--ds-color-brand-secondary: #0a2540;
--ds-color-neutral-0: #ffffff;
--ds-color-neutral-100: #f6f9fc;
--ds-color-neutral-200: #e6ebf1;
--ds-color-neutral-500: #8898aa;
--ds-color-neutral-700: #65707e;
--ds-color-neutral-900: #0a2540;
--ds-color-success: #30b27b;
--ds-color-success-subtle: rgba(48, 178, 123, 0.12);
--ds-color-success-text: #1a7a52;
--ds-color-warning: #f7ab0a;
--ds-color-warning-subtle: rgba(247, 171, 10, 0.12);
--ds-color-warning-text: #7a5100;
--ds-color-danger: #df1b41;
--ds-color-danger-subtle: rgba(223, 27, 65, 0.1);
--ds-color-danger-text: #b00020;
```

### Spacing (4px base scale)

```css
--ds-space-1: 4px;
--ds-space-2: 8px;
--ds-space-3: 12px;
--ds-space-4: 16px;
--ds-space-6: 24px;
--ds-space-8: 32px;
--ds-space-12: 48px;
--ds-space-16: 64px;
```

### Typography

```css
--ds-font-size-xs: 11px;
--ds-font-size-sm: 13px;
--ds-font-size-md: 15px;
--ds-font-size-lg: 17px;
--ds-font-size-xl: 20px;
--ds-font-size-2xl: 24px;
--ds-font-weight-regular: 400;
--ds-font-weight-medium: 500;
--ds-font-weight-semibold: 600;
--ds-line-height-tight: 1.2;
--ds-line-height-normal: 1.5;
```

### Borders & Shadows

```css
--ds-radius-sm: 4px;
--ds-radius-md: 6px;
--ds-radius-lg: 10px;
--ds-radius-full: 9999px;
--ds-shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.08);
--ds-shadow-md: 0 4px 12px rgba(0, 0, 0, 0.1);
--ds-shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);
```

---

## Available Components

Before creating a new component, check if one already exists:

| Component | Import                           | Variants                                       |
| --------- | -------------------------------- | ---------------------------------------------- |
| `Button`  | `@public-internet/design-system` | `primary`, `secondary`, `destructive`, `ghost` |
| `Input`   | `@public-internet/design-system` | `default`, `error`, `disabled`                 |
| `Card`    | `@public-internet/design-system` | `default`, `elevated`, `bordered`              |
| `Badge`   | `@public-internet/design-system` | `success`, `warning`, `danger`, `neutral`      |
| `Text`    | `@public-internet/design-system` | `heading`, `body`, `caption`, `label`          |
| `Stack`   | `@public-internet/design-system` | `vertical`, `horizontal`                       |
| `Divider` | `@public-internet/design-system` | —                                              |
| `Icon`    | `@public-internet/design-system` | —                                              |

**If a layout or feature cannot be built from existing components, do not invent
a one-off. Instead, flag the gap clearly:**

```
// GAP: This requires a <DataTable> component not yet in the design system.
// Recommend adding F-011-data-table to backlog before proceeding.
```

---

## Compound Components

Some components expose subcomponents as named properties on the parent. This is the **compound component pattern**. Use it when a component has distinct structural zones (header, body, footer) that benefit from semantic names and consistent default styles.

### When to use compound components

**Use compound components when:**

- A component has 2+ distinct layout zones (e.g. header, body, footer) that each carry semantic meaning
- Each zone has its own default styles (typography, padding, alignment)
- Consumers frequently need to populate only some zones, not all
- The subcomponents are layout-only — they do not share runtime state

**Use simple composition (children only) when:**

- The component renders a single content area with no structural zones
- Subcomponents would need to share state (use React Context instead)
- The component is a primitive (Button, Input, Badge, Text, Divider, Icon)

### Pattern

```tsx
// Define subcomponents as plain functions
function CardRoot({ variant = 'default', children, className }: CardProps) {
  return <div className={...}>{children}</div>
}

function CardHeader({ children, className }: CardHeaderProps) {
  return <div className={styles.header}>{children}</div>
}

// Attach subcomponents via Object.assign — no Context needed
export const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Body: CardBody,
  Footer: CardFooter,
})

// Set displayName for React DevTools
CardRoot.displayName = 'Card'
CardHeader.displayName = 'Card.Header'
```

### Usage

```tsx
// ✅ Compound pattern — use when you need structured zones
<Card variant="elevated">
  <Card.Header>Payment received</Card.Header>
  <Card.Body>$1,200.00 — just now</Card.Body>
  <Card.Footer>
    <Button variant="ghost" size="sm">Dismiss</Button>
    <Button variant="primary" size="sm">View details</Button>
  </Card.Footer>
</Card>

// ✅ Simple children — still valid for flat content
<Card variant="default">
  Simple card content without structural zones.
</Card>
```

### Rules

- **Never use React Context** for layout-only subcomponents. Context is for shared runtime state (e.g. selected tab, open/closed accordion).
- **Do not add `Stack.Item` or polymorphic `as` prop** — YAGNI. Add these only when a concrete use case demands it.
- **Export all subcomponent prop interfaces** from `index.ts` and the package barrel (`src/index.ts`).
- **Subcomponents are optional** — the parent component must render sensibly with just `children` (no subcomponents required).

---

## `forwardRef` Pattern

`Button` and `Input` are wrapped in `React.forwardRef`. Apply this pattern to any component that renders a single focusable HTML element, so consumers (form libraries, autofocus logic) can attach refs.

```tsx
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ variant = 'primary', ... }, ref) {
    return <button ref={ref} ...>...</button>
  }
)
Button.displayName = 'Button'
```

**When to add `forwardRef`:**

- Component renders a single focusable element (`<button>`, `<input>`, `<a>`)
- Consumers may need to call `.focus()`, `.blur()`, or read `.value` imperatively
- Component is used with form libraries (react-hook-form, Formik) that attach refs

**When NOT to add `forwardRef`:**

- Component renders a container with multiple children (Card, Stack, Divider)
- Component is a pure layout primitive with no single focal element

---

## Component Conventions

### File Structure

Every component lives in its own folder:

```
src/components/Button/
├── Button.tsx
├── Button.module.css
├── Button.stories.tsx
├── Button.test.tsx
└── index.ts
```

### Props Interface Pattern

```tsx
// ✅ Always define a named Props interface
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  children: React.ReactNode
  className?: string
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  children,
  className,
  onClick,
}: ButtonProps) => { ... }
```

### Styling Rules

```tsx
// ✅ CSS Modules + design tokens
import styles from './Button.module.css'
<button className={`${styles.root} ${styles[variant]} ${className ?? ''}`} />

// ✅ Tokens via CSS variables in .module.css
.root { background: var(--ds-color-brand-primary); }

// ❌ No inline styles
<button style={{ backgroundColor: '#635BFF' }} />

// ❌ No hardcoded values
.root { background: #635BFF; }

// ❌ No Tailwind utility classes
<button className="bg-indigo-500 px-4 py-2" />
```

---

## Storybook Story Convention

Every component **must** have a `.stories.tsx` file. This is a lifecycle gate.

```tsx
import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './Button'

const meta = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  args: { children: 'Button label' },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = { args: { variant: 'primary' } }
export const Secondary: Story = { args: { variant: 'secondary' } }
export const Loading: Story = { args: { loading: true } }
export const Disabled: Story = { args: { disabled: true } }
```

---

## A/B Experiment Convention

Experimental variants go in `src/experiments/` and are **never** exported from `index.ts`.

```tsx
// src/experiments/ButtonRounded/ButtonRounded.stories.tsx
export default {
  title: 'Experiments/ButtonRounded',
  tags: ['experiment'],
  parameters: {
    docs: {
      description: {
        component: `
**Hypothesis:** Pill-shaped buttons improve CTA click-through on checkout.
**Changed:** border-radius 6px → 9999px
**Status:** 🔲 Testing
        `,
      },
    },
  },
}
```

---

## Testing

Every component must have a `.test.tsx` file. This is a lifecycle gate, the same as `.stories.tsx`.

### Stack

- **Runner:** [Vitest](https://vitest.dev/) — configured in `vitest.config.ts`
- **Rendering:** `@testing-library/react`
- **Interactions:** `@testing-library/user-event`
- **Matchers:** `@testing-library/jest-dom` + `jest-axe` (auto-loaded via `src/test/setup.ts`)

### Test pattern

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { describe, it, expect } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  it('renders its label', () => {
    render(<Button>Save</Button>)
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Save</Button>)
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('is disabled when disabled prop is set', () => {
    render(<Button disabled>Save</Button>)
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<Button>Save</Button>)
    expect(await axe(container)).toHaveNoViolations()
  })
})
```

### Rules

- **Test behaviour, never implementation.** Assert on what the user sees and can do: visible text, roles, aria state, side effects. Never check internal state, refs, or prop forwarding.
- Use `getByRole`, `getByText`, `getByLabelText` — avoid `getByTestId` unless no semantic query fits.
- Use `userEvent` for interactions (click, type, keyboard). Never use `fireEvent`.
- One behaviour per `it` block — keep tests focused and readable.
- **Every component must include an axe accessibility test** — `jest-axe` is configured globally in `src/test/setup.ts`.

### Running tests

```bash
pnpm test:watch                                                # watch mode for development
pnpm --filter @public-internet/design-system test:coverage    # coverage report + 70% threshold gate (pre-push + CI)
```

Coverage threshold: **≥70%** on lines, functions, branches, and statements. This is enforced on pre-push and in CI — the build will fail if any metric falls below 70%.

---

## AI Quality Gate

When a component is created or modified by AI (Claude), run `/audit-component <ComponentName>` before opening a PR. This runs 5 automated checks that catch AI-generated mistakes that CI cannot detect:

| #   | Check                  | What it catches                                                        | How to fix                                 |
| --- | ---------------------- | ---------------------------------------------------------------------- | ------------------------------------------ |
| 1   | **Token audit**        | Hardcoded hex colors, px font sizes, raw font weights in `.module.css` | Replace with `var(--ds-*)` tokens          |
| 2   | **Story completeness** | Fewer than 3 named story exports in `.stories.tsx`                     | Add missing story variants                 |
| 3   | **Axe test presence**  | Missing `toHaveNoViolations()` in `.test.tsx`                          | Add the axe test (auto-fix available)      |
| 4   | **Barrel export**      | Component not exported from `src/index.ts`                             | Add export (auto-fix available)            |
| 5   | **CSS Modules only**   | Inline `style={{` props in the component `.tsx`                        | Move to `.module.css` with token variables |

**Rule:** All ❌ FAIL items must be resolved before a PR can be created. ⚠️ WARN items should be resolved but will not block the PR.

---

## Bundle Size Budget

The design system has a bundle size gate enforced in CI. After adding a new component, run:

```bash
pnpm build --filter @public-internet/design-system
pnpm --filter @public-internet/design-system size
```

This checks the gzipped size of `dist/index.js` against the budget defined in `.size-limit.json`.
If the budget is exceeded, update `.size-limit.json` with the new baseline + 20% headroom and explain
the increase in the PR description.

---

## Versioning & Changelog

This package uses [Changesets](https://github.com/changesets/changesets) for semantic versioning and changelog generation.

### When to add a changeset

**Every PR that modifies `packages/design-system` must include a changeset.** Run:

```bash
pnpm changeset
```

### Choosing the right bump type

| Bump type | When to use                                                                                           |
| --------- | ----------------------------------------------------------------------------------------------------- |
| **patch** | Bug fixes, accessibility improvements, internal refactors — nothing visible in the public API changes |
| **minor** | New components, new optional props, new exports — fully backwards-compatible additions                |
| **major** | Breaking changes — anything that requires consumers to update their code                              |

### Checking pending releases

```bash
pnpm changeset status    # shows all unreleased changesets and the resulting version bump
```

> `apps/web` is a private bundle and is **not versioned** — never add a changeset for app-only changes.

---

## Lifecycle Gates

Before committing any code, all of these must pass:

```bash
pnpm typecheck                                                 # tsc --noEmit — zero errors, strict mode
pnpm lint                                                      # ESLint — zero errors
pnpm build                                                     # Builds cleanly across all packages
pnpm --filter @public-internet/design-system test:coverage    # Vitest — zero failures, ≥70% coverage
```

Pre-commit hooks enforce lint/typecheck. Tests + coverage run on pre-push and in CI.

**Component checklist before opening a PR:**

- [ ] TypeScript props interface defined
- [ ] No `any` types
- [ ] CSS uses only design tokens
- [ ] `.stories.tsx` file exists with at least 3 stories
- [ ] `.test.tsx` file exists — behaviour tested, not implementation
- [ ] `.test.tsx` includes an `axe` accessibility test (`has no accessibility violations`)
- [ ] Storybook a11y panel shows zero violations for all stories
- [ ] ESLint reports zero `jsx-a11y/*` errors
- [ ] Component tested in at least one reference app
- [ ] No console.log statements
- [ ] Changeset added (`pnpm changeset`) if `packages/design-system` was modified
