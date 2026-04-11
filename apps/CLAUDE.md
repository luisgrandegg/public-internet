# CLAUDE.md — Apps

> Rules scoped to `apps/`. The root `CLAUDE.md` applies globally on top of these.

## Apps in this monorepo

| App | Path | Description |
|---|---|---|
| `touristical-renting` | `apps/touristical-renting/` | Commission-free tourist rental platform (the Stay platform from CONSTITUTION.md) |

Each app has its own `CLAUDE.md` with context scoped to that platform. Read it before working in that app.

---

## Import Rules

Always import components from the design system package — never via relative cross-package paths.

```tsx
// ✅ Correct
import { Button, Card, Stack } from '@public-internet/design-system'

// ❌ Never do this
import { Button } from '../../packages/design-system/src/components/Button'
```

---

## Composition Rules

Apps compose, they don't define. Do not create one-off component wrappers.

```tsx
// ✅ Compose from design system primitives
<Card>
  <Stack>
    <Text variant="heading">Payment</Text>
    <Button>Pay now</Button>
  </Stack>
</Card>

// ❌ No styled wrappers or local component variants
const PaymentCard = styled(Card)`
  padding: 32px;
`
```

---

## Flagging Gaps

If a UI requirement cannot be met with existing design system components, **do not silently work around it**. Flag it explicitly and stop:

```tsx
// GAP: This requires a <Stepper> component not yet in the design system.
// Recommend adding to backlog before proceeding.
```

Then add the missing component to [`backlog/backlog.md`](../../backlog/backlog.md).
