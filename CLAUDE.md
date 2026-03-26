# Claude Code — AI Rules for public-internet

## Project Overview

This is a **pnpm + Turborepo monorepo** containing:

- `apps/web` — Next.js 15 application (App Router)
- `packages/design-system` — Shared component library (Tailwind CSS + CVA)

---

## Repository Structure

```
public-internet/
├── apps/
│   └── web/                  # Next.js app
│       └── src/app/          # App Router pages and layouts
├── packages/
│   └── design-system/        # Design system library
│       ├── src/
│       │   ├── components/   # UI components
│       │   ├── tokens/       # Design tokens
│       │   └── lib/          # Utilities (cn, etc.)
│       └── tailwind.preset.ts
├── CLAUDE.md
├── turbo.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

---

## Tech Stack

| Concern        | Tool                                  |
| -------------- | ------------------------------------- |
| Monorepo       | pnpm workspaces + Turborepo           |
| Framework      | Next.js 15 (App Router)               |
| Language       | TypeScript (strict)                   |
| Styling        | Tailwind CSS v4                       |
| Component API  | class-variance-authority (CVA)        |
| Class merging  | clsx + tailwind-merge (`cn` utility)  |
| Build (lib)    | tsup                                  |

---

## General Rules

- **Always use TypeScript**. No `.js` files in source.
- **Never use `any`**. Use `unknown` and narrow properly.
- **Strict mode is on**. All TypeScript options in `tsconfig.base.json` apply.
- **No barrel files with side effects**. Only re-export, never run code.
- **Prefer named exports** over default exports, except for Next.js pages and layouts (which must be default exports).
- **No inline styles**. Use Tailwind classes exclusively.
- Use the `cn()` utility from `@public-internet/design-system` for conditional class merging.

---

## Design System Rules (`packages/design-system`)

### Component Structure

Each component lives in its own folder:

```
src/components/ComponentName/
├── ComponentName.tsx   # Implementation
└── index.ts            # Re-exports only
```

### Component Guidelines

- Use `React.forwardRef` for all interactive/DOM components.
- Always set `displayName` on forwarded-ref components.
- Use `cva()` (class-variance-authority) for variant-based styling.
- Export the component, its variants function, and its prop types from `index.ts`.
- Props interface extends the relevant HTML element's attributes:
  ```ts
  interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
      VariantProps<typeof buttonVariants> {}
  ```
- Do **not** hardcode colors directly in components — reference Tailwind tokens.

### Tokens

- All design tokens (colors, spacing, typography) live in `src/tokens/`.
- Token values should match the Tailwind preset in `tailwind.preset.ts`.
- When adding a new color ramp, add it to both `src/tokens/colors.ts` and `tailwind.preset.ts`.

### Adding a New Component

1. Create `src/components/ComponentName/ComponentName.tsx`
2. Create `src/components/ComponentName/index.ts` (re-exports only)
3. Add the export to `src/components/index.ts`
4. Run `pnpm build` in `packages/design-system` to verify

---

## Next.js App Rules (`apps/web`)

- Use the **App Router** (`src/app/`). Do not use the Pages Router.
- **Server Components by default**. Add `"use client"` only when necessary (event handlers, hooks, browser APIs).
- Layout files (`layout.tsx`) must export a default React component.
- Page files (`page.tsx`) must export a default React component.
- Import design system components from `@public-internet/design-system`.
- Global styles live in `src/app/globals.css` (Tailwind entry point).

---

## Monorepo Rules

- **Package naming**: `@public-internet/<name>` (e.g. `@public-internet/web`, `@public-internet/design-system`).
- **Internal dependencies**: Use `workspace:*` protocol in `package.json`.
- **Run commands from the root** using Turborepo tasks (`pnpm build`, `pnpm dev`, etc.).
- Do **not** run `npm` or `yarn` — use `pnpm` exclusively.
- Adding a dependency to a workspace package: `pnpm --filter @public-internet/<name> add <dep>`.

---

## Naming Conventions

| Thing               | Convention         | Example                   |
| ------------------- | ------------------ | ------------------------- |
| Components          | PascalCase         | `Button`, `TextInput`     |
| Files (components)  | PascalCase         | `Button.tsx`              |
| Files (utilities)   | camelCase          | `utils.ts`                |
| CSS classes         | Tailwind utilities | `bg-brand-500 text-white` |
| Tokens              | camelCase          | `colors.brand[500]`       |
| Variables/functions | camelCase          | `buttonVariants`          |
| Types/interfaces    | PascalCase         | `ButtonProps`             |

---

## What NOT to Do

- Do not add CSS modules or styled-components — Tailwind only.
- Do not use `React.FC` — prefer explicit return types or none.
- Do not spread unknown objects onto DOM elements without filtering.
- Do not import from `packages/design-system/src` directly in `apps/web` — always use the package name `@public-internet/design-system`.
- Do not create wrapper components just to add a className — extend via `cn()`.
- Do not add dependencies without checking if they're already available in the monorepo.
