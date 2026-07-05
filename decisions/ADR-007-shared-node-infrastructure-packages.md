# ADR-007 — Shared node-infrastructure packages: `node-auth` and `payments`

**Status:** Accepted
**Date:** 2026-07-04

## Context

The Stay and Eats platforms were built with deliberately duplicated infrastructure code: each app carries its own copy of the better-auth configuration, the auth server actions and pages, and the `PaymentProvider` layer (ADR-006). At two apps the duplication was tolerable and kept the apps independently deployable. A third platform is now planned, and the copies have already drifted once (webhook error codes, payment-label helpers) — the review on PR #19 caught divergence that only existed because the same logic lived in two places.

Separately, nodes want additional sign-in strategies. Some operators (municipalities with existing Google Workspace, co-ops using Google accounts) want "Sign in with Google" — while ADR-004 chose better-auth explicitly for having **no OAuth dependency**, which must remain true: a node with no Google credentials must be fully functional.

## Decision

**1. Two new workspace packages own node infrastructure. Apps configure; they do not reimplement.**

| Package | Owns | Apps keep |
|---|---|---|
| `@public-internet/node-auth` | `createNodeAuth()` factory (better-auth + Prisma adapter + email/password + password-reset wiring + `nextCookies` + optional social strategies), `createNodeAuthClient()` | Their `src/lib/auth.ts` reduced to a configuration call (role fields, email provider, db); the better-auth Prisma model blocks in their own schema |
| `@public-internet/payments` | The `PaymentProvider` interface, `StripePaymentProvider`, env-driven provider selection (`selectPaymentProvider()`), and `createPaymentWebhookHandler()` — a factory that authenticates + translates webhook events and delegates lifecycle effects to app callbacks (`onSucceeded`, `onCanceled`) | Their `Payment` schema block, the two lifecycle callbacks (Stay deletes the unpaid booking; Eats flips the payment), checkout-session creation call sites |

**2. Prisma schema blocks stay per-app.** Prisma has no schema composition; each app keeps the canonical auth/payment model blocks (documented in the packages' READMEs) and its own migrations. Cross-app schema drift is prevented by the packages' types, not by sharing the schema file.

**3. Auth strategies are pluggable per node, and all optional.** `createNodeAuth()` enables email + password always; a social strategy is enabled only when the node's environment carries its credentials (`GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` for Google). The sign-in/up pages render social buttons only for enabled strategies. A node with no OAuth credentials behaves exactly as before — ADR-004's "no OAuth dependency" holds: Google is a per-node convenience, never a requirement, and account linking uses better-auth's standard `Account` table that already exists in both schemas.

**4. User bases remain per-node.** Reuse is code reuse. Each app/node keeps its own users, sessions, and database (federation-first; also matches the one-Supabase-project-per-app deployment model).

## Alternatives considered

- **Keep copying** — two apps already diverged; a third copy triples the drift surface.
- **A single shared "platform core" package** (auth + payments + email + API helpers in one) — too coarse; forces every app to take every dependency and couples release cadence. Two focused packages match the two seams that actually exist.
- **Shared user database / central identity** — violates the constitution's standalone-node principle.
- **NextAuth/Auth.js for OAuth** — would replace working better-auth infrastructure for no gain; better-auth supports social providers natively.

## Consequences

- New apps wire auth + payments in ~an hour: install the two packages, paste the schema blocks, pass config.
- The packages are built like `design-system` (tsup, workspace dependency, built before apps in CI).
- The "no PSP SDK imports outside the payments layer" rule now reads: only `@public-internet/payments` may import a PSP SDK. Same shape for auth: apps import better-auth only via `@public-internet/node-auth`.
- Google sign-in requires per-node Google Cloud OAuth credentials and the redirect URI `https://<node-domain>/api/auth/callback/google`; documented in each app's DEPLOYMENT.md.
