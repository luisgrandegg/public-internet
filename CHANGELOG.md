# Changelog

Releases of the Public Internet node software. The versioned artifact is this
repository — see [ADR-008](./decisions/ADR-008-node-release-versioning.md).

**Operators: upgrade to a tag, not to `main`.** `main` may carry unreleased work.

```bash
git remote add upstream https://github.com/luisgrandegg/public-internet.git   # once
git fetch upstream --tags
git merge v0.4.0
git push origin main        # your host rebuilds and redeploys
```

Every release is marked with its impact on a running node **before** the prose:

| Marker | Meaning |
|---|---|
| 🗄️ **Migrations** | Applies schema changes. Prisma migrations are forward-only — back up first. |
| ⚙️ **Config** | Requires a new or changed environment variable. Set it *before* deploying. |
| 💥 **Breaking** | You must act. Read [UPGRADING.md](./UPGRADING.md) before merging. |
| 🔐 **Security** | Contains a security fix. Upgrade promptly. |

A release with no markers is safe to take directly.

Semver here describes impact on a **node operator**, not on a library consumer:
**major** = you must act · **minor** = new capability, safe to take · **patch** = fixes only.

Releases are an offer, never a mandate. A node may stay on an old release indefinitely,
skip releases, and will never be nagged, expired, or phoned home about. Nothing in the
software checks whether a newer release exists.

---

## Unreleased

Changes merged to `main` but not yet in a tagged release.

### Added
- `GET /api/version` on both apps — reports the release a node is running, so an operator
  can answer "what am I on?" without inspecting git. Returns the version and app name only;
  no telemetry, no outbound call.
- `CHANGELOG.md`, `UPGRADING.md`, and `.github/workflows/release.yml` — the release process
  described in ADR-008.
- Vercel deploy guides for both apps (`apps/stay/VERCEL.md`, `apps/eats/VERCEL.md`),
  covering the deploy button, what the copy contains, and how to take upstream changes.

### Fixed
- `githooks/pre-commit` was mode `100644`, so git had always skipped it — the backlog
  consistency check had never run for any clone. Now `100755`.
- Prisma migrations now resolve a direct connection from `DATABASE_URL_UNPOOLED` and
  `POSTGRES_URL_NON_POOLING` as well as `DIRECT_URL`, so a database provisioned by a
  managed integration migrates without hand-copied connection strings. An explicitly set
  `DIRECT_URL` still wins.

### Changed
- `CLAUDE.md § Package Tagging` replaced by `§ Releases`. The old section described a
  per-package tagging workflow that did not exist.

---

<!--
Template for a new release — copy this block, fill it in, and put it above the previous
release. Delete any section with no entries. Keep the markers on the heading line.

## v0.0.0 — YYYY-MM-DD   🗄️ Migrations · ⚙️ Config · 💥 Breaking · 🔐 Security

One sentence an operator can act on: what this release does for their node.

### Added
### Changed
### Fixed
### Security

### Upgrade notes
Only when 🗄️, ⚙️, or 💥 applies — otherwise omit and link nothing.
See [UPGRADING.md](./UPGRADING.md#v000).
-->
