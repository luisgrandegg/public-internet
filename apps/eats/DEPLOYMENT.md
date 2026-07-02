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

## Operator notes (constitution alignment)

Running an Eats node means upholding the principles in [CONSTITUTION.md](../../CONSTITUTION.md), and Eats touches **labour**, so the worker-rights principle is binding:

- **Flat fee, never a cut.** `EATS_INFRASTRUCTURE_FEE_CENTS` is a flat amount that covers actual operating costs. No percentage commission. No surge pricing. The fee is published to customers before they confirm an order.
- **Courier pay is transparent.** Pay is always shown as `basePay + distancePay`, never an opaque total. The amounts are snapshotted onto each delivery at creation so a courier can always see how their pay was calculated.
- **Couriers are rights-holders.** Prefer a cooperative or proper employment model over contractor misclassification where law permits. No arbitrary deactivation without an appeal path.
- **Free restaurant onboarding.** No exclusivity demands, no pay-to-rank.
- **No dark patterns.** No urgency copy, no hidden fees, no pre-ticked consent.

### Federation (roadmap)

The constitution describes Eats running as local nodes (a neighbourhood cooperative, a city hospitality association). Federation is opt-in and a node can leave without data loss. A single node today is a complete, fully functional deployment on its own.
