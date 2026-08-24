# Deploy Eats to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fluisgrandegg%2Fpublic-internet&root-directory=apps%2Feats&project-name=eats-node&repository-name=eats-node&env=BETTER_AUTH_SECRET%2CNEXT_PUBLIC_APP_URL&envDescription=BETTER_AUTH_SECRET+signs+session+cookies+%2832%2B+random+chars%29.+NEXT_PUBLIC_APP_URL+is+this+node+public+URL+and+is+baked+in+at+build+time.&envLink=https%3A%2F%2Fgithub.com%2Fluisgrandegg%2Fpublic-internet%2Fblob%2Fmain%2Fapps%2Feats%2FVERCEL.md%232-fill-in-the-two-required-variables&products=%5B%7B%22type%22%3A%22integration%22%2C%22integrationSlug%22%3A%22neon%22%2C%22productSlug%22%3A%22neon%22%2C%22protocol%22%3A%22storage%22%7D%5D)

A managed **Eats** node — commission-free food delivery with worker rights — on Vercel
with a Postgres database provisioned in the same flow. About **10 minutes**, no terminal
required.

- Prefer to own the whole stack? → [DEPLOYMENT.md](./DEPLOYMENT.md) (self-hosted, systemd + your own Postgres)
- Just want it running on your laptop? → [QUICKSTART.md](./QUICKSTART.md)

---

## Honest answer: it is not literally one click

The button below gets you most of the way, but **two values cannot be automated**, and
Vercel's deploy button has no mechanism to supply them for you:

| | Why it cannot be automated |
|---|---|
| `BETTER_AUTH_SECRET` | The deploy button prompts for environment variables but never generates them, and secrets must never ship as defaults. Generating one at build time would also rotate it on every deploy and sign every user out. **You paste a random string once.** |
| `NEXT_PUBLIC_APP_URL` | Next.js inlines `NEXT_PUBLIC_*` into the client bundle at **build** time, but the node's domain does not exist until the project is created. Chicken-and-egg. **You type the expected URL, then confirm it after the first build.** |

Everything else — forking the repo, the monorepo root directory, the Postgres database,
the connection strings, the schema migrations, the build order, the published fee and
courier pay defaults — is handled for you. So: **one click, two fields, and one thing to
check afterwards.**

---

## What the button actually does

1. Forks `luisgrandegg/public-internet` into your GitHub account.
2. Creates a Vercel project with **Root Directory** `apps/eats`.
3. Provisions a **Neon Postgres** database through the Vercel Marketplace and injects
   `DATABASE_URL` (pooled, used by the app) and `DATABASE_URL_UNPOOLED` (direct, used by
   migrations) automatically.
4. Prompts you for `BETTER_AUTH_SECRET` and `NEXT_PUBLIC_APP_URL`.
5. Runs the build defined in [`vercel.json`](./vercel.json):

   ```
   pnpm install --frozen-lockfile
   → design-system build   → prisma migrate deploy   → next build
   ```

   The first deploy therefore creates every table (User, Restaurant, MenuItem, Order,
   Delivery, Review …) in the empty database.

You need a GitHub account and a Vercel account. Neon's free tier is enough to try a node;
nothing here requires a paid plan.

---

## 1. Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fluisgrandegg%2Fpublic-internet&root-directory=apps%2Feats&project-name=eats-node&repository-name=eats-node&env=BETTER_AUTH_SECRET%2CNEXT_PUBLIC_APP_URL&envDescription=BETTER_AUTH_SECRET+signs+session+cookies+%2832%2B+random+chars%29.+NEXT_PUBLIC_APP_URL+is+this+node+public+URL+and+is+baked+in+at+build+time.&envLink=https%3A%2F%2Fgithub.com%2Fluisgrandegg%2Fpublic-internet%2Fblob%2Fmain%2Fapps%2Feats%2FVERCEL.md%232-fill-in-the-two-required-variables&products=%5B%7B%22type%22%3A%22integration%22%2C%22integrationSlug%22%3A%22neon%22%2C%22productSlug%22%3A%22neon%22%2C%22protocol%22%3A%22storage%22%7D%5D)

Pick a **project name** — this decides your default domain, so choose the one you want
users to see: `eats-yourcity` → `https://eats-yourcity.vercel.app`.

> ✍️ **Write the project name down.** You need it verbatim in the next step.

Accept the Neon database when Vercel offers it. If you would rather bring your own
Postgres (Supabase, a co-op's server, an existing cluster), skip the integration and see
[Bring your own Postgres](#bring-your-own-postgres) below.

> ℹ️ The local dev port (`3001`) is irrelevant here — on Vercel the app is served on
> `443` behind your domain.

---

## 2. Fill in the two required variables

| Variable | What to enter |
|---|---|
| `BETTER_AUTH_SECRET` | 32+ random characters. Generate one with `openssl rand -base64 32`, or in the browser console: `crypto.randomUUID() + crypto.randomUUID()`. Treat it like a password — rotating it later signs every user out. |
| `NEXT_PUBLIC_APP_URL` | `https://<project-name>.vercel.app`, using the exact project name from step 1. No trailing slash. Step 4 confirms it. |

Everything else is optional. The node is fully functional without any of it:

| Optional | Default when unset |
|---|---|
| `EATS_INFRASTRUCTURE_FEE_CENTS` | `99` (€0.99) — the **flat** fee per order. Never a percentage, never demand-adjusted, always published before the customer confirms. |
| `EATS_COURIER_BASE_PAY_CENTS` | `400` (€4.00) |
| `EATS_COURIER_DISTANCE_PAY_CENTS` | `200` (€2.00) — pay is always shown to the courier as base + distance, never as an opaque total. |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | **Offline settlement** — customers pay on delivery. A first-class mode, not a degraded one (ADR-006). |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Email + password sign-in only (ADR-007). |

Set the fee and pay values to what your node actually charges and pays before you invite
real restaurants and couriers — see [Tune the economics](#tune-the-economics).

---

## 3. Let it build

The first build takes a few minutes — it installs the workspace, builds the shared design
system, runs the migrations, then builds Next.js. Watch the log for:

```
Applying migration `..._init`
```

That line means the schema reached the database. If the build fails here, jump to
[Troubleshooting](#troubleshooting).

---

## 4. Confirm the domain matches `NEXT_PUBLIC_APP_URL`

**This is the step people skip, and it is the one that breaks sign-in.**

When the deploy finishes, Vercel shows the production domain. If your project name was
already taken, Vercel appends a suffix — the domain may be
`eats-yourcity-abc123.vercel.app` rather than what you typed in step 2.

Compare it to `NEXT_PUBLIC_APP_URL`. If they differ:

1. **Settings → Environment Variables** → edit `NEXT_PUBLIC_APP_URL` to the real domain.
2. **Deployments → ⋯ → Redeploy** (uncheck "use existing build cache").

`NEXT_PUBLIC_APP_URL` is baked into the client bundle, so changing it always requires a
rebuild — restarting is not enough. better-auth also uses it as the trusted origin and
cookie base, and server actions self-fetch through it; a mismatch shows up as sign-in
that silently fails or redirects in a loop.

The same applies when you attach a **custom domain** later: add the domain in Vercel,
update `NEXT_PUBLIC_APP_URL` to match, redeploy.

---

## 5. Verify the node

The database starts empty. Walk the full three-role loop — it exercises every layer:

1. Open the production URL — the home page renders.
2. **Owner:** sign up, click "Add your restaurant", complete the onboarding opt-in
   (it must not be pre-ticked), register a restaurant, add menu items at
   `/restaurant/[id]/menu`.
3. **Customer:** sign up in another browser, browse to the restaurant, build a cart, and
   check that the **full cost — items + the published flat fee — is visible before you
   confirm**. Place the order.
4. **Courier:** sign up a third account, register at `/courier/register`. Once the owner
   marks the order ready, the delivery appears on the courier dashboard with pay shown as
   **base + distance** before accepting.
5. Empty-state check: with a fresh database, the restaurant list renders cleanly with no
   restaurants.

If step 2 works but the restaurant will not save, the problem is the database. If step 1
works and sign-up does not, the problem is almost always `NEXT_PUBLIC_APP_URL` (step 4).

---

## Tune the economics

These are the numbers your node publishes, and the constitution constrains them:

| Variable | Constraint |
|---|---|
| `EATS_INFRASTRUCTURE_FEE_CENTS` | A **flat** amount covering operating costs. Never a percentage of the basket, never adjusted by demand, time of day, or weather. Shown to the customer before they confirm. |
| `EATS_COURIER_BASE_PAY_CENTS` | Guaranteed per delivery, independent of distance. |
| `EATS_COURIER_DISTANCE_PAY_CENTS` | Shown separately, never folded into an opaque total. Couriers are workers with rights, not contractors. |

Set them under **Settings → Environment Variables** and redeploy. They are read at
runtime, so no rebuild subtleties apply — but a redeploy is still the simplest way to
pick them up.

---

## Optional extras

### Online payments (Stripe)

Only after you know the final domain:

1. Stripe dashboard → **Developers → Webhooks → Add endpoint**
   → `https://<your-domain>/api/webhooks/payments`
   → events `checkout.session.completed` and `checkout.session.expired`.
2. Set `STRIPE_SECRET_KEY` (your node's own account — never a central one) and the
   endpoint's `STRIPE_WEBHOOK_SECRET` in Vercel, then redeploy.

Customers are charged exactly the pre-confirmation total: items plus the published flat
infrastructure fee, and nothing else, ever. Payment is confirmed only by the
signature-verified webhook — never by the success redirect.

Not using Stripe? The `PaymentProvider` interface takes any PSP — see
[DEPLOYMENT.md → Plugging in your own payment gateway](./DEPLOYMENT.md#plugging-in-your-own-payment-gateway).

### Sign in with Google

1. Your own Google Cloud Console → **APIs & Services → Credentials → OAuth client ID**
   → **Web application**.
2. Authorized redirect URI: `https://<your-domain>/api/auth/callback/google`.
3. Set `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` in Vercel and redeploy.

The "Continue with Google" button appears only when both are set. Accounts stay in your
node's own database — Google is a per-node convenience, never a dependency (ADR-007).

### Preview deployments

If you enable previews, set the same variables for the **Preview** environment. Previews
share the production database unless you give them their own — for anything with real
customer, courier, or order data, give them their own.

---

## Bring your own Postgres

Skip the Neon step and set the connection strings yourself:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Pooled connection string — what the app uses at runtime. Serverless functions need a pooler. On Supabase, the **transaction pooler** (port `6543`). |
| `DIRECT_URL` | Non-pooled connection string — what `prisma migrate deploy` uses. Poolers cannot run DDL. On Supabase, the **session/direct** string (port `5432`). |

`prisma.config.ts` resolves the migration connection as
`DIRECT_URL → DATABASE_URL_UNPOOLED → POSTGRES_URL_NON_POOLING → DATABASE_URL`, which is
why the Neon integration needs no manual wiring and Supabase needs only `DIRECT_URL`.

The full Supabase walkthrough is in
[DEPLOYMENT.md → Managed deployment](./DEPLOYMENT.md#managed-deployment-vercel--supabase).

---

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| Sign-in appears to do nothing, or loops back to the sign-in page | `NEXT_PUBLIC_APP_URL` does not match the domain you are visiting. Fix it and **redeploy** — see [step 4](#4-confirm-the-domain-matches-next_public_app_url). |
| Build fails on `prisma migrate deploy` with a connection error | No direct connection available. Set `DIRECT_URL` to a non-pooled string. |
| Build fails resolving `@public-internet/design-system` | **Settings → General → Root Directory**: `apps/eats`, with *"Include source files outside of the Root Directory"* enabled. The app builds a shared workspace package. |
| Build fails on `pnpm install --frozen-lockfile` | Your fork's `pnpm-lock.yaml` is out of sync with `package.json`. Run `pnpm install` locally and commit the lockfile. |
| Runtime 500s on every page | `DATABASE_URL` is missing or the database is unreachable. A paused free-tier database also does this — open it in the provider's dashboard to resume. |
| `BETTER_AUTH_SECRET` errors at startup | Shorter than 32 characters, or not set for the environment being deployed. |
| Checkout total looks wrong | Check `EATS_INFRASTRUCTURE_FEE_CENTS` — it is an **integer in cents** (`99`, not `0.99`). |
| Everything works, then sign-in breaks after adding a custom domain | Expected — update `NEXT_PUBLIC_APP_URL` and redeploy. |

---

## Upgrades

Merge upstream changes into your fork's production branch. Vercel rebuilds and the build
command applies any new migrations automatically. No manual migration step.

---

## Constitution note

Managed hosting trades some operator ownership for convenience, and
[CONSTITUTION.md](../../CONSTITUTION.md) asks: *"can a local node own, export, and migrate
this data without vendor lock-in?"* For this deployment, yes:

- **Your data stays yours.** `pg_dump` from Neon (or any provider) restores into any
  PostgreSQL 16. Nothing phones home.
- **No platform-specific APIs.** The app depends on nothing Vercel- or Neon-specific, so
  the same commit runs on a co-op's own server — see [DEPLOYMENT.md](./DEPLOYMENT.md).
- **Zero commission still applies.** The node takes a published flat fee covering costs —
  never a cut of the basket — and courier pay stays transparent and itemised.
- **Leaving is a supported operation,** not a rescue mission: dump the database, follow
  the self-hosted guide, point DNS at your own box.
