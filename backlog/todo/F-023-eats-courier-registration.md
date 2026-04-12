# F-023 — Eats: courier registration

## Summary

The `/courier/register` page lets a user register as a courier. The page must clearly explain how pay is calculated (`basePay + distancePay`) before the user signs up. Language must never classify couriers as independent contractors — they are "delivery workers" or "couriers". On completion, `User.isCourier` is set to `true`.

## What this feature includes

- Page: `/courier/register` with a short registration form (confirm name, agree to courier terms)
- Server Action or direct API call: set `User.isCourier = true` for the session user
- A clear, honest explanation of the pay model on the registration page — shown before the user commits

## Constitution constraints (binding)

- No "independent contractor" language — use "courier" or "delivery worker"
- Pay calculation explained before registration: base pay per delivery + per-km distance rate
- No opt-out checkbox for rights — registration either confers rights or it doesn't
- Mention the appeal path for account decisions, clearly and before registration

## Acceptance criteria

- [ ] Page explains `basePay + distancePay` model before the user can submit
- [ ] No "independent contractor" or "gig worker" language anywhere on the page
- [ ] Appeal path for adverse account decisions is mentioned on the registration page
- [ ] Sets `User.isCourier = true` on the session user on success
- [ ] Redirects unauthenticated users to `/auth/signin`
- [ ] `pnpm --filter @public-internet/eats type-check` passes
- [ ] e2e spec: registration page contains pay model explanation and appeal path copy (`e2e/courier/register.spec.ts`)

## Notes

- No new API route needed — use a Server Action or a thin PATCH on the user profile
- If a dedicated `PATCH /api/user/profile` route is introduced here, annotate it with `@swagger`
