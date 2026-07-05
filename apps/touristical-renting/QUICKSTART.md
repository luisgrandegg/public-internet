# Quickstart — Stay (touristical-renting)

From clone to a running commission-free accommodation platform in ~5 minutes.
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
docker compose -f apps/touristical-renting/docker-compose.yml up -d
# → PostgreSQL 16 on localhost:5432, db "touristical_renting"
```

(Already running your own Postgres? Create a database and point `DATABASE_URL` at it in step 3.)

## 3. Configure

```bash
cp apps/touristical-renting/.env.example apps/touristical-renting/.env
```

The defaults match the docker-compose database — for local development you don't need to change anything. Stripe and Google are optional and off by default (offline payments, email + password auth).

## 4. Migrate

```bash
pnpm --filter @public-internet/touristical-renting db:deploy
```

## 5. Run

```bash
pnpm --filter @public-internet/design-system build   # once, after a fresh clone
pnpm --filter @public-internet/touristical-renting dev
```

Open **http://localhost:3000**. The database starts empty — sign up, check "Are you a host?", and create a listing through the wizard at `/host/listings/new`; then sign up a second account to search and book it.

## Useful commands

| Command | What it does |
|---|---|
| `pnpm --filter @public-internet/touristical-renting test:e2e` | Playwright suite (build the app first: `... build`, then it starts its own server) |
| `pnpm --filter @public-internet/touristical-renting db:studio` | Browse the database in Prisma Studio |
| `pnpm --filter @public-internet/touristical-renting db:migrate` | Create a new migration after editing `prisma/schema.prisma` |
| `pnpm type-check && pnpm lint` | The CI gates, locally |

## Optional integrations

- **Online payments (Stripe):** set `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` in `.env` (use `stripe listen --forward-to localhost:3000/api/webhooks/payments` for local webhooks). Unset → guests "pay at the property".
- **Sign in with Google:** set `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` (redirect URI `http://localhost:3000/api/auth/callback/google`). Unset → email + password only.
- Password-reset emails print to the server console in development (stub email provider).
