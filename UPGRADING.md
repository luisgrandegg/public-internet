# Upgrading a node

Per-release upgrade steps for node operators. Read this **before** merging a release marked
🗄️ Migrations, ⚙️ Config, or 💥 Breaking in [CHANGELOG.md](./CHANGELOG.md). A release with
no markers needs nothing from this file.

Background: [ADR-008 — Node releases](./decisions/ADR-008-node-release-versioning.md).

---

## The upgrade loop

```bash
# once, if the deploy button cloned rather than forked your node
git remote add upstream https://github.com/luisgrandegg/public-internet.git

git fetch upstream --tags
git log --oneline v0.3.0..v0.4.0        # what you are about to take
git merge v0.4.0
git push origin main                    # your host rebuilds and redeploys
```

Confirm afterwards with `GET /api/version` on your node — it reports the release you are
actually running, which is the check that catches a deploy that silently did not happen.

## Before any release marked 🗄️ Migrations

**Back up the database first.** Prisma migrations are forward-only — there is no `migrate
down`, so a bad migration cannot be undone, only restored from.

```bash
pg_dump "$DATABASE_URL" > backup-$(date +%F).sql
```

Migrations run **inside the build** (`vercel.json` calls `prisma migrate deploy` before
`next build`). Two things follow:

- A failed migration can leave the schema partly changed while the previous build is still
  serving traffic. Check the build log for `Applying migration` lines before assuming a
  deploy succeeded.
- Rolling the deployment back does **not** roll the schema back. Restore from your dump.

If you run several nodes, take the release on the smallest one first.

## Before any release marked ⚙️ Config

Set the new environment variable **before** deploying, not after. Anything named
`NEXT_PUBLIC_*` is inlined into the client bundle at build time, so changing it later
requires a rebuild — restarting is not enough.

## If you customised the code

If you implemented your own `PaymentProvider` or edited branding, you changed tracked files
and `git merge` may conflict there. Keep your side for your own provider selection, take
upstream's side for the interface itself, then verify before pushing:

```bash
pnpm install --frozen-lockfile
pnpm type-check && pnpm lint
```

Conflicts in `src/lib/payments/index.ts` are expected — that file is the documented
selection point. A cleaner customisation seam is planned; see ADR-008 § Consequences.

## Staying put is fine

You are never required to upgrade. A node running an old release is a node in good
standing: nothing expires, nothing nags, and nothing reports your version anywhere. Skip
releases freely — the loop above works across any span of tags, though a jump over a
💥 Breaking release means reading every intervening section here, not just the newest.

---

## Per-release notes

Nothing yet — no tagged release has required operator action. New sections go **above**
this line, newest first, anchored so `CHANGELOG.md` can link to them (`#v040`).
