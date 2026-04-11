# /wireframe-to-component

Turn a wireframe description into a composed view using existing design system components. Produces a page/view file in `apps/web`.

---

## What to do

### Step 1 — Gather the wireframe description

Ask the user to describe:

1. **Page/view name** — e.g. `PaymentSummary`, `TransactionList`
2. **Layout description** — sections, content areas, what each contains (columns, cards, lists, forms, headings, actions)
3. **Key interactions** — buttons, inputs, or state (loading, empty, error)

If already described in the message, proceed directly.

### Step 2 — Map the wireframe to existing components

Before writing any code, list which design system components will be used for each section. Only use components from this list:

| Component | Use for                                       |
| --------- | --------------------------------------------- |
| `Card`    | Content containers, panels                    |
| `Stack`   | Vertical or horizontal layout grouping        |
| `Text`    | Headings, body copy, labels, captions         |
| `Button`  | Actions (primary CTA, secondary, destructive) |
| `Input`   | Form fields                                   |
| `Badge`   | Status indicators, tags                       |
| `Icon`    | Iconography                                   |
| `Divider` | Section separators                            |

If the wireframe requires something not in this list, **do not invent a one-off component**. Instead:

```
// GAP: This requires a <DataTable> component not yet in the design system.
// Recommend adding to backlog before implementing this section.
```

Flag the gap to the user and ask how to proceed (skip that section, or add to backlog first).

### Step 3 — Create the view file

Create a new file in `apps/web/src/views/<ViewName>.tsx` (or `apps/web/src/app/<route>/page.tsx` if it maps to a route).

Rules:

- Import all components from `@public-internet/design-system`
- No inline styles — layout uses `Stack` with `gap` prop or a co-located `.module.css` using design tokens
- No one-off wrapper components — compose directly
- TypeScript: typed props if the view accepts any

### Step 4 — Wire it into the app

Add the view to the app's routing or main layout so it renders and can be tested visually:

- Tell the user where to find it (which route or how to trigger it)

### Step 5 — Verify

```bash
pnpm typecheck
pnpm lint
```

Fix any errors.

### Step 6 — Confirm to the user

Tell the user:

- Where the view file is
- How to preview it (run `pnpm dev`)
- List any gaps flagged that need components added to the design system
- Suggest `/new-component` for any flagged gaps, then return to this view
