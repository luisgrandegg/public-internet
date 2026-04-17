# F-033 — Eats: courier registration

## Summary

The `/courier/register` page lets a user register as a courier. The page must clearly explain how pay is calculated (`basePay + distancePay`) before the user signs up. Language must never classify couriers as independent contractors — they are "delivery workers" or "couriers". On completion, `User.isCourier` is set to `true`.

## What this feature includes

- Page: `/courier/register` with a short registration form (acknowledge pay model)
- Server Action: set `User.isCourier = true` for the session user
- A clear, honest explanation of the pay model on the registration page — shown before the user commits

## Constitution constraints (binding)

- No "independent contractor" language — use "courier" or "delivery worker"
- Pay calculation explained before registration: base pay per delivery + per-km distance rate
- No opt-out checkbox for rights — registration either confers rights or it doesn't
- Mention the appeal path for account decisions, clearly and before registration

## Acceptance criteria

- [x] Page explains `basePay + distancePay` model before the user can submit
- [x] No "independent contractor" or "gig worker" language anywhere on the page
- [x] Appeal path for adverse account decisions is mentioned on the registration page
- [x] Sets `User.isCourier = true` on the session user on success
- [x] Redirects unauthenticated users to `/auth/signin`
- [x] `pnpm --filter @public-internet/eats type-check` passes
- [x] e2e spec: registration page constraints (`e2e/courier/register.spec.ts`)

## Notes

- No new API route needed — uses a Server Action that updates the user directly
- The page reads the default pay values from config so the amounts shown match what the courier dashboard displays

---

## Completed

**Completed:** 2026-04-17
**Branch:** claude/food-delivery-missing-features-jo5BM
**Audit:** `pnpm --filter @public-internet/eats type-check` and `lint` pass with zero errors
**Notes:** Page body walks the user through the pay model and rights before the acknowledgement Checkbox becomes visible. The acknowledgement is an explicit, unchecked Checkbox — never pre-ticked. The Server Action flips `User.isCourier = true` via `db.user.update`. Copy uses "courier" / "delivery worker" throughout — no contractor language.
