# /brainstorm-variants

Generate 3 design alternatives for a component or flow, with tradeoffs noted and Storybook story stubs for each.

---

## What to do

### Step 1 — Gather the brief

Ask the user for:

1. **Subject** — which component or flow to explore (e.g. `Button`, `checkout payment step`)
2. **Design goal** — what outcome they want to improve (e.g. "higher CTA conversion", "clearer error states", "faster form completion")
3. **Constraints** — anything that must stay the same (e.g. "must work on mobile", "must use existing tokens only")

If provided in the message, proceed directly.

### Step 2 — Generate 3 distinct alternatives

Produce 3 meaningfully different approaches. Each should vary on a real design axis — not just colour tweaks. Good axes to vary:

- Layout / information hierarchy
- Interaction pattern (inline vs modal, single step vs multi-step)
- Emphasis (minimal vs prominent, text vs icon, contained vs full-width)
- Feedback model (optimistic vs confirmed, inline vs toast)

For each alternative, write:

**Variant A — [Short name]**

- What it is: 1–2 sentence description
- Key change from baseline: the specific design decision
- Hypothesis: why this might improve the goal
- Tradeoffs: what it gives up
- Best for: which context or user type suits this best

Repeat for B and C.

### Step 3 — Create story stubs

For each variant, create a story stub file at:
`packages/design-system/src/experiments/<Subject>VariantA/` (and B, C)

Each stub:

```tsx
// <Subject>VariantA.stories.tsx
export default {
  title: 'Experiments/<Subject>/VariantA — <Short name>',
  tags: ['experiment'],
  parameters: {
    docs: {
      description: {
        component: `
**Variant:** A — <Short name>
**Hypothesis:** <from step 2>
**Tradeoffs:** <from step 2>
**Status:** 🔲 Not built — stub only
        `,
      },
    },
  },
}

// Stub story — replace with real component when ready to build
export const Preview = () => null
```

Stubs are intentionally empty — they document the idea without committing to building it.

### Step 4 — Recommend

Based on the goal and constraints, recommend which variant to build first and why. Keep the recommendation to 2–3 sentences.

### Step 5 — Offer next steps

Ask the user:

- "Which variant would you like to build? I can scaffold it with `/ab-variant` or `/new-component`."
- "Or would you like to see a fourth direction?"
