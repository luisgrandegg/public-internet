# ADR-001 — CSS Modules over Tailwind/CSS-in-JS

**Status:** Accepted
**Date:** 2026-04-11

## Context

The design system (`packages/design-system`) needs a styling solution that:

- Is consumed by multiple reference apps without leaking implementation details
- Works with strict TypeScript without requiring runtime dependencies
- Produces deterministic, encapsulated styles that do not conflict across package boundaries
- Supports a design token system (CSS custom properties) as the single source of truth for color, spacing, and typography
- Is legible to designers who are not full-time engineers — style files should be easy to read and edit in isolation

The project targets a POC audience of UX designers using Claude Code. The styling choice directly affects what patterns Claude Code will generate and what the component checklist enforces.

## Decision

Use **CSS Modules** (`.module.css` files) for all component styles. Design tokens are expressed as CSS custom properties (`var(--ds-color-brand-primary)`) and consumed directly in `.module.css` files. No inline styles. No utility class strings in JSX.

## Alternatives Considered

**Tailwind CSS**
- Rejected because utility classes are tightly coupled to HTML structure, making it harder for designers to see "what does this button look like?" without reading the component file. Purging also requires build-time configuration that increases setup complexity. Utility classes bypass the token system — a designer can write `bg-indigo-500` instead of `var(--ds-color-brand-primary)`, quietly breaking the token contract.

**styled-components / Emotion (CSS-in-JS with runtime)**
- Rejected because they add a JS runtime dependency and require SSR configuration. They also increase bundle size and complicate Storybook setup. Generated class names are opaque to designers inspecting the browser.

**vanilla-extract**
- A stronger candidate — type-safe, zero runtime, works with design tokens. Rejected because it requires a build plugin (Vite/Next config changes) that increases the setup surface area for a POC. CSS Modules achieve 90% of the same goals without any plugin.

**Inline styles (`style={{ ... }}`)**
- Rejected outright. Cannot use CSS pseudo-classes (`:hover`, `:focus`), media queries, or CSS custom properties without workarounds. No encapsulation.

## Consequences

**Positive:**
- Full style encapsulation — component styles cannot leak across the package boundary
- Zero runtime overhead — CSS Modules are compiled to plain CSS at build time
- Designers can open `Button.module.css` and read it without understanding JSX
- Design tokens enforced at the CSS level; hardcoded hex values are immediately visible as violations
- No build plugin required — works out of the box with Vite and Next.js
- ESLint and TypeScript treat imported class names as typed objects, catching typos

**Negative:**
- No utility classes — layout helpers (flexbox, gap, padding) must be written per-component rather than composed in JSX
- More verbose than Tailwind for one-off spacing adjustments
- Requires designers to context-switch between `.tsx` and `.module.css` files when editing a component
- Class name composition (e.g. `${styles.root} ${styles[variant]}`) can become unwieldy for components with many variant combinations
