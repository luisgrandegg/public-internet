# ADR-008 — Node releases: the repository is the versioned artifact

**Status:** Accepted
**Date:** 2026-08-24

## Context

Two cities can now deploy Stay or Eats — self-hosted (`DEPLOYMENT.md`) or managed
(`VERCEL.md`). Neither guide can tell an operator *what they are running*, because nothing
in this repository produces a version.

The state before this ADR:

- Every package sits at `0.0.1` and has never been bumped — through four migrations per app
  and a full feature parity drop (#19).
- The repository has **zero git tags**, local or remote.
- `CLAUDE.md § Package Tagging` claimed a workflow tags packages whose version changed on
  merge to `main`. No such workflow existed; `.github/workflows/` contained only `ci.yml`.
- The PR template asks for a changeset; there is no `.changeset/` directory and no
  changeset tooling.
- The documented upgrade path is `git merge upstream/main`.

So a node's identity is the SHA it last merged. Madrid and Barcelona cannot compare what
they run, cannot be told that a release carries a destructive migration, and cannot be
reached about a security fix.

Three constraints are specific to this project:

1. **Migrations are forward-only and run inside the build.** `vercel.json` calls
   `prisma migrate deploy` as a build step, and Prisma has no down migrations. A failed
   migration can leave the schema half-changed while the previous build still serves.
2. **Operators are told to edit tracked files.** `DEPLOYMENT.md` instructs them to
   implement a `PaymentProvider` and select it in `src/lib/payments/index.ts`. Every
   upstream merge is therefore a likely conflict in exactly the file they were told to edit.
3. **Versioning must never become a control lever.** CONSTITUTION.md §4 (federation-first)
   and §3 (public entity governance) mean a node must be able to stay on an old release
   indefinitely, skip releases, and never phone home.

## Decision

**1. The versioned artifact is the repository, not the npm packages.**

Both apps are `private: true` and are never published. What an operator deploys is a git
ref. Releases are therefore **repo-level git tags** — `v0.4.0` — not per-package tags.
`CLAUDE.md § Package Tagging` is replaced by `§ Releases` describing this.

Per-package publishing is explicitly deferred: it only matters if an app ever leaves the
monorepo, and today the monorepo is load-bearing for the build (neither app compiles
without four workspace packages plus the root workspace, lockfile and tsconfig).

**2. Semver describes impact on a node operator, not on a library consumer.**

| Bump | Means |
|---|---|
| **major** | An operator must act. A dropped or renamed column, a newly required environment variable, a `PaymentProvider` interface change, a removed route. |
| **minor** | New capability, safe to take. May include additive migrations (new table, new nullable column). |
| **patch** | Fixes and docs. No schema change. |

**3. Operators upgrade to tags, never to `main`.**

`main` is a moving target and may carry unreleased work. Both deploy guides tell operators
to merge `v0.4.0`, not `upstream/main`.

**4. Every release states its operator impact up front.** `CHANGELOG.md` marks each release
with whether it carries **migrations**, **new required configuration**, **breaking**
changes, or **security** fixes — before the prose. `UPGRADING.md` carries the per-release
steps for anything a changelog line cannot express.

**5. A node can report its own version.** `GET /api/version` returns the release the node
is running, so an operator can answer "what am I on?" without inspecting git. It exposes
only the version string and app name — no telemetry, no outbound call.

**6. Releases are an offer, never a mandate.** No auto-update, no phone-home, no
"unsupported version" nag, no expiry. A node running `v0.2.0` forever is a node in good
standing. Nothing in the software may check for, report, or act on the availability of a
newer release.

## Alternatives considered

- **Per-package semver + npm publishing (changesets).** The natural read of the old
  `Package Tagging` text. Rejected as the primary mechanism: it versions the wrong thing.
  An operator deploys a repo, not `@public-internet/design-system`. Revisit only if an app
  is extracted.
- **Date-based releases (`2026.08`).** Honest about "this is a snapshot", but loses the
  single most valuable signal — whether an upgrade demands operator action.
- **Keep merging `main`.** Zero process, and what happens today. It cannot express
  "this one has a destructive migration", which is the case that costs a city its data.
- **A release branch per minor (`release/0.4`) with backports.** Correct at scale, and
  more maintenance than a project with two live nodes can carry. Tags now; branches when a
  real backport is needed.

## Consequences

- Cutting a release means: bump the root `package.json` version, write the `CHANGELOG.md`
  entry with its impact markers, and push the tag. `.github/workflows/release.yml` verifies
  that the tag matches the root version and that the changelog has a matching section — a
  tag that skips the changelog fails.
- `NEXT_PUBLIC_APP_VERSION` is read from the root `package.json` at build time and surfaced
  by `/api/version`.
- Operators who customised tracked files still face merge conflicts. This ADR does not
  solve that; a customisation seam (provider selection by environment variable, or a
  gitignored local module) is follow-up work and should get its own ADR.
- Federation, when built, needs its **own** protocol version, negotiated between nodes and
  bumped independently of the app release. A node three releases behind must still be able
  to federate, or version becomes the control lever this ADR forbids.
- Because migrations run inside the build and cannot be rolled back, the changelog's
  migration marker is the operator's only warning. Treat an unmarked migration as a defect.
