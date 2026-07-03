# Deploying Eats

How to run an **Eats** node — the commission-free food delivery platform — in production.

This guide is self-contained: if you are only deploying Eats, you do not need to read the other apps' guides. Eats is designed to run as an independent local node (a city's hospitality association, a neighbourhood cooperative) with no dependency on any central server. See [CONSTITUTION.md](../../CONSTITUTION.md) for the governance and worker-rights model this deployment must honour.

---

## What you are deploying

| | |
|---|---|
| **App** | `@public-internet/eats` |
| **Framework** | Next.js 15 (React 19, TypeScript strict) |
| **Database** | PostgreSQL (required) |
| **Auth** | better-auth — email + password, session-based |
| **Default port** | `3000` (set `PORT` to change — see note below) |
| **Stateful** | Yes — Postgres holds restaurants, menus, orders, deliveries |

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

Eats needs a PostgreSQL 16 database it owns. The bundled compose file gives you one for local or single-box deployments:

```bash
docker compose -f apps/eats/docker-compose.yml up -d
# → postgres 16 on localhost:5433 (host port), db "eats", user/pass eats/eats
```

> Note the host port is **5433**, not 5432 — chosen so Eats and Stay can run on the same machine without colliding. Inside the container Postgres still listens on 5432; the connection string maps it to 5433 on the host.

For production, point at a database you control and **replace the default `eats/eats` credentials** with a dedicated role and a strong password.

---

## 2. Configure environment

```bash
cp apps/eats/.env.example apps/eats/.env
```

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string for your production DB |
| `BETTER_AUTH_SECRET` | ✅ | Signs session tokens. **Min 32 chars.** Generate: `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | ✅ | Public URL of this node, e.g. `https://eats.yourcity.org` |
| `EATS_INFRASTRUCTURE_FEE_CENTS` | ⬜ | Flat per-order fee in cents. Default `99` (€0.99) |
| `EATS_COURIER_BASE_PAY_CENTS` | ⬜ | Courier base pay per delivery, in cents. Default `400` |
| `EATS_COURIER_DISTANCE_PAY_CENTS` | ⬜ | Courier distance pay per delivery, in cents. Default `200` |
| `NODE_ENV` | ✅ | Set to `production` |

> ⚠️ **`NEXT_PUBLIC_APP_URL` is inlined at _build_ time.** Set it to the final public URL **before** you build — changing it later requires a rebuild, not just a restart.

> 💶 The fee and pay variables encode constitution constraints (see operator notes). They are read at runtime, so you can adjust pay without rebuilding — but the infrastructure fee must always stay a **flat** amount, never a percentage or demand-adjusted figure.

> 🔐 Never commit `.env`. Rotate `BETTER_AUTH_SECRET` if exposed.

---

## 3. Install and build

From the **monorepo root**:

```bash
pnpm install --frozen-lockfile        # also runs `prisma generate` via postinstall
NEXT_PUBLIC_APP_URL="https://eats.yourcity.org" \
  pnpm --filter @public-internet/eats... build
```

The `...` suffix builds the app **and its workspace dependencies** (`design-system`, `eats-sdk`) in order. To build the whole monorepo instead, run `pnpm build`.

---

## 4. Run database migrations

Apply the committed migrations with **`migrate deploy`** (applies existing migrations only — never generates or prompts):

```bash
pnpm --filter @public-internet/eats db:deploy
```

Migrations live in `apps/eats/prisma/migrations/` and define the schema (User, Restaurant, MenuItem, Order, OrderItem, Delivery, plus the `OrderStatus` and `DeliveryStatus` enums). Run this on every deploy that ships a schema change.

---

## 5. Start the server

> **Port gotcha:** the `start` script is plain `next start`, which defaults to port **3000** — the same default as Stay. If you run Eats and Stay on the same host, give Eats an explicit `PORT` (e.g. `3001`) so they don't collide.

```bash
NODE_ENV=production \
PORT=3001 \
  pnpm --filter @public-internet/eats start
```

Put your reverse proxy in front of it and terminate TLS there. The proxy's public hostname **must** match `NEXT_PUBLIC_APP_URL`, or auth redirects and SDK calls will break.

### Example: systemd unit

```ini
[Unit]
Description=Eats
After=network.target postgresql.service

[Service]
WorkingDirectory=/srv/public-internet
EnvironmentFile=/srv/public-internet/apps/eats/.env
Environment=NODE_ENV=production
Environment=PORT=3001
ExecStart=/usr/bin/pnpm --filter @public-internet/eats start
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

### Example: minimal Caddy reverse proxy

```
eats.yourcity.org {
    reverse_proxy localhost:3001
}
```

---

## 6. Verify the deployment

1. Visit `https://eats.yourcity.org` — the home page renders.
2. Sign up and sign in — confirms `BETTER_AUTH_SECRET` and the DB are wired correctly.
3. As a restaurant owner, create a restaurant and a menu item — confirms writes reach Postgres.
4. Place an order — confirm the per-order fee shown matches `EATS_INFRASTRUCTURE_FEE_CENTS` and courier pay shows as **base + distance**, never an opaque total.
5. Empty-state check: with a fresh DB, the restaurants page renders cleanly with none listed.

---

## Managed deployment: Vercel + Supabase

The self-hosted path above keeps the node fully operator-owned. If you accept
managed infrastructure, the repo is pre-configured for **Vercel** (hosting)
plus **Supabase** (PostgreSQL): `apps/eats/vercel.json` runs migrations and
builds in the right order on every deploy.

### 1. Supabase

1. Create a project (pick your region). In **Project Settings → Database**, copy two connection strings:
   - **Transaction pooler** (port `6543`) → this becomes `DATABASE_URL` (what the app uses at runtime; serverless functions need the pooler).
   - **Session / direct** (port `5432`) → this becomes `DIRECT_URL` (what Prisma migrations use; poolers cannot run DDL).
2. Nothing else to configure — the app uses better-auth and Prisma directly; Supabase's own Auth/Storage/RLS are not used.

### 2. Vercel

1. **Add New Project → Import** this repository.
2. Set **Root Directory** to `apps/eats` (keep "Include source files outside of the Root Directory" enabled — the app builds the shared design-system package).
3. Vercel picks up `vercel.json`: install runs `pnpm install --frozen-lockfile`, and the build runs `design-system build → prisma migrate deploy → next build`. Migrations run against `DIRECT_URL` automatically on every deploy.
4. Set the environment variables (Production, and Preview if you use it):

| Variable | Value |
|---|---|
| `DATABASE_URL` | Supabase **transaction pooler** string (port 6543) |
| `DIRECT_URL` | Supabase **session/direct** string (port 5432) |
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | The production URL, e.g. `https://eats-yourcity.vercel.app` (update after the first deploy or when adding a custom domain) |
| `EATS_INFRASTRUCTURE_FEE_CENTS` | Your node's published flat fee, e.g. `99` |
| `EATS_COURIER_BASE_PAY_CENTS` | e.g. `400` |
| `EATS_COURIER_DISTANCE_PAY_CENTS` | e.g. `200` |
| `STRIPE_SECRET_KEY` | *(optional)* enables online payments |
| `STRIPE_WEBHOOK_SECRET` | *(required with the key)* from a Stripe webhook endpoint pointed at `https://<your-domain>/api/webhooks/payments` |

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
NEXT_PUBLIC_APP_URL="https://eats.yourcity.org" \
  pnpm --filter @public-internet/eats... build
pnpm --filter @public-internet/eats db:deploy   # if migrations changed
# restart the service
```

---

## Plugging in your own payment gateway

Online payments are optional (ADR-006): with no provider configured the node runs **offline settlement** — orders are recorded as settled directly (pay on delivery), a first-class mode for a commission-free node. Stripe support is built in: set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` (see `.env.example`) and point a Stripe webhook at `POST /api/webhooks/payments`.

The payment layer is a pluggable `PaymentProvider` interface (ADR-006 amendment), so a node is never locked to Stripe — a regional PSP or a co-op banking partner works the same way:

1. **Implement the interface** in `src/lib/payments/<yourprovider>.ts` — implement `PaymentProvider` from `src/lib/payments/types.ts`: a stable `id` (stored in `Payment.provider`), `createCheckoutSession()` (returns the hosted checkout URL the customer is redirected to; the session total must be exactly the pre-confirmation total — nothing may ever be added), and `parseWebhookEvent()` (MUST authenticate the raw webhook request — e.g. verify its signature — and throw on failure, then map the PSP's events to `payment.succeeded` / `payment.canceled` / `ignored`). This file is the only place allowed to import your PSP's SDK.
2. **Select it** in `src/lib/payments/index.ts` — set `paymentProvider` to your implementation when its configuration is present.
3. **Point your PSP's webhooks** at `POST /api/webhooks/payments` — the route is provider-agnostic and delegates authentication and event translation to the active provider. It answers 503 when no provider is configured.
4. **Define your own env vars** for the gateway's credentials and document them in `.env.example`. Never commit real keys.

Nothing outside `src/lib/payments/` changes: services, routes, and UI depend only on the interface and the provider-neutral `Payment` columns (`providerSessionId`, `providerPaymentReference`, `providerCheckoutUrl`).

---

## Operator notes (constitution alignment)

Running an Eats node means upholding the principles in [CONSTITUTION.md](../../CONSTITUTION.md), and Eats touches **labour**, so the worker-rights principle is binding:

- **Flat fee, never a cut.** `EATS_INFRASTRUCTURE_FEE_CENTS` is a flat amount that covers actual operating costs. No percentage commission. No surge pricing. The fee is published to customers before they confirm an order.
- **Courier pay is transparent.** Pay is always shown as `basePay + distancePay`, never an opaque total. The amounts are snapshotted onto each delivery at creation so a courier can always see how their pay was calculated.
- **Couriers are rights-holders.** Prefer a cooperative or proper employment model over contractor misclassification where law permits. No arbitrary deactivation without an appeal path.
- **Free restaurant onboarding.** No exclusivity demands, no pay-to-rank.
- **No dark patterns.** No urgency copy, no hidden fees, no pre-ticked consent.

### Federation (roadmap)

The constitution describes Eats running as local nodes (a neighbourhood cooperative, a city hospitality association). Federation is opt-in and a node can leave without data loss. A single node today is a complete, fully functional deployment on its own.
