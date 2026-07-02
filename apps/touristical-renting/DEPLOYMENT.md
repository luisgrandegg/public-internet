# Deploying Stay (touristical-renting)

How to run a **Stay** node — the commission-free accommodation platform — in production.

This guide is self-contained: if you are only deploying Stay, you do not need to read the other apps' guides. Stay is designed to run as an independent local node (a city, a cooperative, a neighbourhood association) with no dependency on any central server. See [CONSTITUTION.md](../../CONSTITUTION.md) for the governance model this deployment must honour.

---

## What you are deploying

| | |
|---|---|
| **App** | `@public-internet/touristical-renting` |
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
docker compose -f apps/touristical-renting/docker-compose.yml up -d
# → postgres 16 on localhost:5432, db "touristical_renting", user/pass touristical/touristical
```

For production, point at a database you control (a Postgres on the same host, a cooperative's managed Postgres, a municipal DB). **Do not use the default `touristical/touristical` credentials in production** — create a dedicated role with a strong password.

---

## 2. Configure environment

Copy the example and fill in real values:

```bash
cp apps/touristical-renting/.env.example apps/touristical-renting/.env
```

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string for your production DB |
| `BETTER_AUTH_SECRET` | ✅ | Signs session tokens. **Min 32 chars.** Generate: `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | ✅ | The public URL of this node, e.g. `https://stay.yourcity.org` |
| `NODE_ENV` | ✅ | Set to `production` |

> ⚠️ **`NEXT_PUBLIC_APP_URL` is inlined at _build_ time.** Next.js bakes any `NEXT_PUBLIC_*` variable into the client bundle during `pnpm build`. Set it to the final public URL **before** you build — changing it afterwards requires a rebuild, not just a restart.

> 🔐 Never commit `.env`. Rotate `BETTER_AUTH_SECRET` if it is ever exposed (this invalidates existing sessions).

---

## 3. Install and build

From the **monorepo root**:

```bash
pnpm install --frozen-lockfile        # also runs `prisma generate` via postinstall
NEXT_PUBLIC_APP_URL="https://stay.yourcity.org" \
  pnpm --filter @public-internet/touristical-renting... build
```

The `...` suffix builds the app **and its workspace dependencies** (`design-system`, `touristical-renting-sdk`) in the correct order. To build the entire monorepo instead, run `pnpm build`.

---

## 4. Run database migrations

Apply the committed migrations to your production database. This is **`migrate deploy`** — it applies existing migrations and never generates or prompts for new ones:

```bash
pnpm --filter @public-internet/touristical-renting db:deploy
```

Migrations are committed under `apps/touristical-renting/prisma/migrations/` and are the source of truth for the schema (User, Listing, Photo, Booking, AvailabilityBlock, Enquiry, Review). Run this on every deploy that ships a schema change.

---

## 5. Start the server

```bash
NODE_ENV=production \
PORT=3000 \
  pnpm --filter @public-internet/touristical-renting start
```

The app listens on `PORT` (default `3000`). Put your reverse proxy in front of it and terminate TLS there. The proxy's public hostname **must** match `NEXT_PUBLIC_APP_URL`, or auth redirects and SDK calls will break.

### Example: systemd unit

```ini
[Unit]
Description=Stay (touristical-renting)
After=network.target postgresql.service

[Service]
WorkingDirectory=/srv/public-internet
EnvironmentFile=/srv/public-internet/apps/touristical-renting/.env
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/pnpm --filter @public-internet/touristical-renting start
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

## Upgrades

```bash
git pull
pnpm install --frozen-lockfile
NEXT_PUBLIC_APP_URL="https://stay.yourcity.org" \
  pnpm --filter @public-internet/touristical-renting... build
pnpm --filter @public-internet/touristical-renting db:deploy   # if migrations changed
# restart the service
```

Always run `db:deploy` after pulling changes that touch `prisma/`.

---

## Operator notes (constitution alignment)

Running a Stay node means upholding the principles in [CONSTITUTION.md](../../CONSTITUTION.md):

- **Zero commission.** The platform charges nothing on bookings. If you request contributions to cover infrastructure, they must be optional and clearly labelled — never a percentage cut.
- **Data sovereignty.** This database is yours. You can export, migrate, and delete it at will. Nothing phones home.
- **Discourage commercial concentration.** The platform is designed to surface signals (e.g. night caps) that keep listings genuine rather than full-time commercial operations. Keep those guardrails on.
- **No dark patterns.** No manufactured urgency, no hidden fees, no pre-ticked consent. Pricing is complete and visible before a guest commits.

### Federation (roadmap)

The constitution describes Stay nodes federating (a Madrid node surfacing listings from Getafe and Alcobendas, each retaining local governance). Federation is **opt-in** and a node can leave without data loss. Cross-node federation is not yet implemented — a single node today is a complete, fully functional deployment on its own.
