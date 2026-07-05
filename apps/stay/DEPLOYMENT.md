# Deploying Stay (stay)

How to run a **Stay** node — the commission-free accommodation platform — in production.

This guide is self-contained: if you are only deploying Stay, you do not need to read the other apps' guides. Stay is designed to run as an independent local node (a city, a cooperative, a neighbourhood association) with no dependency on any central server. See [CONSTITUTION.md](../../CONSTITUTION.md) for the governance model this deployment must honour.

---

## What you are deploying

| | |
|---|---|
| **App** | `@public-internet/stay` |
| **Framework** | Next.js 15 (React 19, TypeScript strict) |
| **Database** | PostgreSQL (required) |
| **Auth** | better-auth — email + password, session-based |
| **Default port** | `3000` (set `PORT` to change) |
| **Stateful** | Yes — Postgres holds all listings, bookings, users |

---

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | `22.22.2` | Pinned via [Volta](https://volta.sh); any 22.x works |
| pnpm | `9.15.0` | `corepack enable` or Volta will provision it |
| PostgreSQL | `16` | An operator-owned instance — not a managed vendor lock-in |

A reverse proxy (nginx, Caddy, Traefik) is recommended in front of the app to terminate TLS.

---

## 1. Provision the database

Stay needs a PostgreSQL 16 database it owns. For a quick local or single-box deployment, the bundled compose file gives you one:

```bash
docker compose -f apps/stay/docker-compose.yml up -d
# → postgres 16 on localhost:5432, db "stay", user/pass stay/stay
```

For production, point at a database you control (a Postgres on the same host, a cooperative's managed Postgres, a municipal DB). **Do not use the default `stay/stay` credentials in production** — create a dedicated role with a strong password.

---

## 2. Configure environment

Copy the example and fill in real values:

```bash
cp apps/stay/.env.example apps/stay/.env
```

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string for your production DB |
| `BETTER_AUTH_SECRET` | ✅ | Signs session tokens. **Min 32 chars.** Generate: `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | ✅ | The public URL of this node, e.g. `https://stay.yourcity.org` |
| `NODE_ENV` | ✅ | Set to `production` |
| `STRIPE_SECRET_KEY` | optional | Enables online payments via the built-in Stripe provider. Unset → offline settlement mode (see [Plugging in your own payment gateway](#plugging-in-your-own-payment-gateway)) |
| `STRIPE_WEBHOOK_SECRET` | optional | Signing secret for `POST /api/webhooks/payments` — required when `STRIPE_SECRET_KEY` is set |
| `GOOGLE_CLIENT_ID` | optional | Enables "Sign in with Google" (see [Sign in with Google (optional)](#sign-in-with-google-optional)). Unset → email + password only |
| `GOOGLE_CLIENT_SECRET` | optional | Required together with `GOOGLE_CLIENT_ID` |

> ⚠️ **`NEXT_PUBLIC_APP_URL` is inlined at _build_ time.** Next.js bakes any `NEXT_PUBLIC_*` variable into the client bundle during `pnpm build`. Set it to the final public URL **before** you build — changing it afterwards requires a rebuild, not just a restart.

> 🔐 Never commit `.env`. Rotate `BETTER_AUTH_SECRET` if it is ever exposed (this invalidates existing sessions).

---

## 3. Install and build

From the **monorepo root**:

```bash
pnpm install --frozen-lockfile        # also runs `prisma generate` via postinstall
NEXT_PUBLIC_APP_URL="https://stay.yourcity.org" \
  pnpm --filter @public-internet/stay... build
```

The `...` suffix builds the app **and its workspace dependencies** (`design-system`, `stay-sdk`) in the correct order. To build the entire monorepo instead, run `pnpm build`.

---

## 4. Run database migrations

Apply the committed migrations to your production database. This is **`migrate deploy`** — it applies existing migrations and never generates or prompts for new ones:

```bash
pnpm --filter @public-internet/stay db:deploy
```

Migrations are committed under `apps/stay/prisma/migrations/` and are the source of truth for the schema (User, Listing, Photo, Booking, AvailabilityBlock, Enquiry, Review). Run this on every deploy that ships a schema change.

---

## 5. Start the server

```bash
NODE_ENV=production \
PORT=3000 \
  pnpm --filter @public-internet/stay start
```

The app listens on `PORT` (default `3000`). Put your reverse proxy in front of it and terminate TLS there. The proxy's public hostname **must** match `NEXT_PUBLIC_APP_URL`, or auth redirects and SDK calls will break.

### Example: systemd unit

```ini
[Unit]
Description=Stay (stay)
After=network.target postgresql.service

[Service]
WorkingDirectory=/srv/public-internet
EnvironmentFile=/srv/public-internet/apps/stay/.env
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/pnpm --filter @public-internet/stay start
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

### Example: minimal Caddy reverse proxy

```
stay.yourcity.org {
    reverse_proxy localhost:3000
}
```

---

## 6. Verify the deployment

1. Visit `https://stay.yourcity.org` — the home page renders.
2. Sign up, then sign in — confirms `BETTER_AUTH_SECRET` and the DB are wired correctly.
3. Create a listing as a host — confirms writes reach Postgres.
4. Empty-state check: with a fresh DB, the listings page renders cleanly with no listings.

---

## Sign in with Google (optional)

Auth is configured via the shared `@public-internet/node-auth` package (ADR-007). Email + password is always enabled; Google is a **per-node** extra strategy — the node is fully functional without it, and account data stays in this node's own database (the standard better-auth `Account` table).

1. In the node operator's own **Google Cloud Console**, create an OAuth client: **APIs & Services → Credentials → Create credentials → OAuth client ID**, application type **Web application**.
2. Add the authorized redirect URIs:
   - `https://<your-domain>/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google` (local dev)
3. Set both env vars on the node and redeploy (restart, or redeploy on Vercel):

   ```bash
   GOOGLE_CLIENT_ID="<oauth client id>.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="<oauth client secret>"
   ```

The sign-in and sign-up pages show a "Continue with Google" button only when both variables are set. Removing them turns the button off again — existing Google-linked accounts keep working via password reset if they also set a password.

---

## Managed deployment: Vercel + Supabase

The self-hosted path above keeps the node fully operator-owned. If you accept
managed infrastructure, the repo is pre-configured for **Vercel** (hosting)
plus **Supabase** (PostgreSQL): `apps/stay/vercel.json` runs
migrations and builds in the right order on every deploy.

### 1. Supabase

1. Create a project (pick your region). In **Project Settings → Database**, copy two connection strings:
   - **Transaction pooler** (port `6543`) → this becomes `DATABASE_URL` (what the app uses at runtime; serverless functions need the pooler).
   - **Session / direct** (port `5432`) → this becomes `DIRECT_URL` (what Prisma migrations use; poolers cannot run DDL).
2. Nothing else to configure — the app uses better-auth and Prisma directly; Supabase's own Auth/Storage/RLS are not used.

### 2. Vercel

1. **Add New Project → Import** this repository.
2. Set **Root Directory** to `apps/stay` (keep "Include source files outside of the Root Directory" enabled — the app builds the shared design-system package).
3. Vercel picks up `vercel.json`: install runs `pnpm install --frozen-lockfile`, and the build runs `design-system build → prisma migrate deploy → next build`. Migrations run against `DIRECT_URL` automatically on every deploy.
4. Set the environment variables (Production, and Preview if you use it):

| Variable | Value |
|---|---|
| `DATABASE_URL` | Supabase **transaction pooler** string (port 6543) |
| `DIRECT_URL` | Supabase **session/direct** string (port 5432) |
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | The production URL, e.g. `https://stay-yourcity.vercel.app` (update after the first deploy or when adding a custom domain) |
| `STRIPE_SECRET_KEY` | *(optional)* enables online payments |
| `STRIPE_WEBHOOK_SECRET` | *(required with the key)* from a Stripe webhook endpoint pointed at `https://<your-domain>/api/webhooks/payments` |
| `GOOGLE_CLIENT_ID` | *(optional)* enables "Sign in with Google" — see [Sign in with Google (optional)](#sign-in-with-google-optional) |
| `GOOGLE_CLIENT_SECRET` | *(optional, required with the client id)* |

5. Deploy. First deploy applies all migrations to the empty Supabase database.

### Vercel/Supabase caveats

- `NEXT_PUBLIC_APP_URL` must exactly match the domain users hit — better-auth uses it as the trusted origin and cookie base, and server actions self-fetch through it. After attaching a custom domain, update the variable and redeploy.
- In Stripe mode, create the webhook endpoint in the Stripe dashboard (events: `checkout.session.completed`, `checkout.session.expired`) *after* you know the final domain, then set `STRIPE_WEBHOOK_SECRET`.
- Supabase pauses free-tier projects after inactivity; the app will 500 until the DB resumes.
- Constitution note: managed hosting trades some operator ownership for convenience. The node remains portable — `pg_dump` from Supabase restores into any PostgreSQL 16, and nothing in the app depends on Vercel- or Supabase-specific APIs.

---

## Upgrades

```bash
git pull
pnpm install --frozen-lockfile
NEXT_PUBLIC_APP_URL="https://stay.yourcity.org" \
  pnpm --filter @public-internet/stay... build
pnpm --filter @public-internet/stay db:deploy   # if migrations changed
# restart the service
```

(On Vercel, upgrades are just merges to the production branch — the build
command runs migrations automatically.)

Always run `db:deploy` after pulling changes that touch `prisma/`.

---

## Plugging in your own payment gateway

Online payments go through a pluggable `PaymentProvider` interface (ADR-006, amended) — Stripe is the built-in implementation, not a hard dependency. The interface, the Stripe implementation, and provider selection live in the shared `@public-internet/payments` workspace package (ADR-007). A node can run with Stripe, with a regional PSP you integrate yourself, or with **no provider at all**: when none is configured, the node runs in offline settlement mode (bookings are confirmed with a "pay at the property" payment record and no online payment is taken). Offline mode is a legitimate operating mode, not a degraded one.

To integrate another gateway, implement the package's interface and select it in this app:

1. **Implement the interface** in `src/lib/payments/<yourprovider>.ts`:

   ```ts
   import type { PaymentProvider, CheckoutSessionRequest, CheckoutSession, PaymentWebhookEvent } from '@public-internet/payments'

   export class YourProviderPaymentProvider implements PaymentProvider {
     readonly id = 'yourprovider' // stored in Payment.provider

     async createCheckoutSession(request: CheckoutSessionRequest): Promise<CheckoutSession> {
       // Create a hosted checkout session charging exactly request.amountCents
       // (never add fees or surcharges) and return its id and redirect URL.
     }

     async parseWebhookEvent(rawBody: string, headers: Headers): Promise<PaymentWebhookEvent> {
       // MUST throw if the request is not authentically from your PSP
       // (bad/missing signature). Map settled → 'payment.succeeded',
       // expired/aborted → 'payment.canceled', anything else → 'ignored'.
     }
   }
   ```

2. **Select it** in `src/lib/payments/index.ts` — provider selection is configuration, not code scattered through the app:

   ```ts
   export const paymentProvider: PaymentProvider | null = process.env.YOURPROVIDER_API_KEY
     ? new YourProviderPaymentProvider()
     : selectPaymentProvider() // built-in selection: Stripe when STRIPE_SECRET_KEY is set, else null (offline settlement mode)
   ```

3. **Point your PSP's webhook** at `POST https://<your-node>/api/webhooks/payments`. This single route serves every provider: it hands the raw body and headers to your `parseWebhookEvent()`, marks the payment SUCCEEDED or CANCELED, and returns 400 on authentication failure (503 when no provider is configured).

4. **Define your own env vars** (API key, webhook secret, …) — read them inside your provider file only, and document them in `.env.example`. Apart from custom provider implementations selected here, only `@public-internet/payments` may import a PSP SDK — services, routes, and UI depend only on the interface.

Constraints that apply to every provider: the charged amount is exactly the displayed total (no fees, no surcharges — CONSTITUTION.md), and payment confirmation comes only from the authenticated webhook, never from the success redirect.

---

## Operator notes (constitution alignment)

Running a Stay node means upholding the principles in [CONSTITUTION.md](../../CONSTITUTION.md):

- **Zero commission.** The platform charges nothing on bookings. If you request contributions to cover infrastructure, they must be optional and clearly labelled — never a percentage cut.
- **Data sovereignty.** This database is yours. You can export, migrate, and delete it at will. Nothing phones home.
- **Discourage commercial concentration.** The platform is designed to surface signals (e.g. night caps) that keep listings genuine rather than full-time commercial operations. Keep those guardrails on.
- **No dark patterns.** No manufactured urgency, no hidden fees, no pre-ticked consent. Pricing is complete and visible before a guest commits.

### Federation (roadmap)

The constitution describes Stay nodes federating (a Madrid node surfacing listings from Getafe and Alcobendas, each retaining local governance). Federation is **opt-in** and a node can leave without data loss. Cross-node federation is not yet implemented — a single node today is a complete, fully functional deployment on its own.
