# Quickstart — Eats

From clone to a running commission-free food-delivery platform in ~5 minutes.
(For production, see [DEPLOYMENT.md](./DEPLOYMENT.md).)

## Prerequisites

- **Node.js 22.x** (pinned via [Volta](https://volta.sh), or use any 22.x)
- **pnpm 9** — `corepack enable` provisions it
- **Docker** (for the bundled PostgreSQL), or your own PostgreSQL 16

## 1. Install

From the monorepo root:

```bash
pnpm install
```

This also generates the Prisma client (`postinstall`).

## 2. Start the database

```bash
docker compose -f apps/eats/docker-compose.yml up -d
# → PostgreSQL 16 on localhost:5433, db "eats"
```

(Port 5433 so it can run alongside the Stay database.)

## 3. Configure

```bash
cp apps/eats/.env.example apps/eats/.env
```

The defaults match the docker-compose database and set the published flat infrastructure fee (€0.99) and transparent courier pay. Stripe and Google are optional and off by default (pay on delivery, email + password auth).

## 4. Migrate

```bash
pnpm --filter @public-internet/eats db:deploy
```

## 5. Run

```bash
pnpm --filter @public-internet/design-system build   # once, after a fresh clone
pnpm --filter @public-internet/eats dev
```

Open **http://localhost:3001** (Eats runs on 3001 so it can sit next to Stay on 3000).

The database starts empty. To exercise the full loop with three accounts:

1. **Owner** — sign up, click "Add your restaurant", complete the onboarding opt-in, register a restaurant, add menu items at `/restaurant/[id]/menu`.
2. **Customer** — sign up, browse to the restaurant, build a cart, place the order (full cost shown before you confirm).
3. **Courier** — sign up, register at `/courier/register`; accept the delivery from the courier dashboard once the owner marks the order ready. Pay is always shown as base + distance before accepting.

## Useful commands

| Command | What it does |
|---|---|
| `pnpm --filter @public-internet/eats test:e2e` | Playwright suite (build the app first: `... build`, then it starts its own server) |
| `pnpm --filter @public-internet/eats db:studio` | Browse the database in Prisma Studio |
| `pnpm --filter @public-internet/eats db:migrate` | Create a new migration after editing `prisma/schema.prisma` |
| `pnpm type-check && pnpm lint` | The CI gates, locally |

## Optional integrations

- **Online payments (Stripe):** set `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` in `.env` (use `stripe listen --forward-to localhost:3001/api/webhooks/payments` for local webhooks). Unset → customers pay on delivery.
- **Sign in with Google:** set `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` (redirect URI `http://localhost:3001/api/auth/callback/google`). Unset → email + password only.
- Password-reset emails print to the server console in development (stub email provider).
