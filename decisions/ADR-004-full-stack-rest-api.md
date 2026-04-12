# ADR-004 — Full-stack features with a REST API backend

**Status:** Accepted
**Date:** 2026-04-12

## Context

Early feature work (F-005–F-008) used placeholder Server Actions that validate form shape and return `{ ok: true }` without persisting anything. This was scaffolding — useful to unblock UI work — but it means none of the features are real yet: sign-up creates no account, listing creation saves nothing, search returns only hard-coded mock data.

The project's goal is to build real public infrastructure, not demos. Features should work end to end from the moment they are implemented. A sign-up form that does not create an account is not a feature; it is a wireframe with CSS.

Additionally, the platform is designed to be operated by municipalities and cooperatives (CONSTITUTION.md §3 — "Could a public entity govern this without a private intermediary?"). These operators may integrate the backend with their own systems, import/export data, or federate across nodes. A REST API makes all of this possible. Server Actions alone do not — they are tightly coupled to a single Next.js deployment and cannot be called from external systems.

## Decision

**Every feature that creates, reads, updates, or deletes data must be implemented end-to-end:**

1. **Data persists to a real database.** No in-memory stores. No placeholder implementations. No `return { ok: true }` without actually doing the work.

2. **Mutations and queries are exposed as REST endpoints** under `/api/` following REST conventions, in addition to any Server Actions that call them. Server Actions are thin wrappers — they call the same REST handlers that external clients would use.

3. **The backend stack for each app is:**

   | Layer | Choice | Rationale |
   |---|---|---|
   | API routing | Next.js Route Handlers (`app/api/**/route.ts`) | Single deployable unit; no separate process to manage; aligns with federation-first constitution principle |
   | Database | PostgreSQL | Battle-tested, open source, owned by the operator, exportable — no vendor lock-in |
   | ORM | Prisma | Type-safe queries, schema-as-code, migration tooling, excellent Next.js integration |
   | Auth | `better-auth` | Open source, supports email+password without OAuth dependency, session-based (no JWT footguns), self-hostable |

4. **Schema lives in `prisma/schema.prisma`** at the app root. Migrations are committed to the repo. Running `pnpm db:migrate` applies them.

5. **Environment variables** for database connections are declared in `.env.example` and documented. Never hardcoded.

## REST API conventions

```
POST   /api/auth/sign-up          → 201 Created | 400 Validation error | 409 Conflict
POST   /api/auth/sign-in          → 200 OK (sets session cookie) | 401 Unauthorized
POST   /api/auth/sign-out         → 204 No Content
POST   /api/auth/forgot-password  → 204 No Content (always, to prevent enumeration)

GET    /api/listings              → 200 OK (array, supports ?location=&propertyType=&page=)
POST   /api/listings              → 201 Created | 401 Unauthorized | 400 Validation error
GET    /api/listings/:id          → 200 OK | 404 Not Found
PATCH  /api/listings/:id          → 200 OK | 401 | 403 Forbidden | 404
DELETE /api/listings/:id          → 204 No Content | 401 | 403 | 404

POST   /api/bookings              → 201 Created | 400 | 401 | 409 (conflict / unavailable)
GET    /api/bookings/:id          → 200 OK | 401 | 403 | 404
```

Response shape:
```json
// Success
{ "data": { ... } }

// Error
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "fields": { "email": "..." } } }
```

HTTP status codes are the source of truth for outcome — never `{ ok: false }` with a 200 status.

## Server Actions as thin wrappers

Server Actions remain the UI integration point (they support `useActionState`, progressive enhancement, and streaming). They must call the REST handler internally rather than duplicating logic:

```typescript
// ✅ Server Action delegates to the REST handler
'use server'
export async function signUp(prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const response = await fetch(`${process.env.API_BASE_URL}/api/auth/sign-up`, {
    method: 'POST',
    body: JSON.stringify({ name: formData.get('name'), email: formData.get('email'), ... }),
    headers: { 'Content-Type': 'application/json' },
  })
  if (!response.ok) {
    const { error } = await response.json()
    return { ok: false, fieldErrors: error.fields ?? {}, globalError: error.message }
  }
  return { ok: true }
}

// ❌ Server Action does the work itself (duplicates logic, not callable externally)
'use server'
export async function signUp(prev, formData) {
  await db.user.create({ data: { email: formData.get('email') } }) // logic trapped here
  return { ok: true }
}
```

## Alternatives considered

**Server Actions only (no REST layer)**
- Rejected: not callable from external clients, not federatable, not testable with standard HTTP tools (curl, Postman, integration tests). Violates the constitution's federation-first and public governance principles.

**Separate backend service (e.g. Express app in `apps/api`)**
- Rejected for now: increases deployment complexity, requires two processes, makes local development harder. Next.js Route Handlers provide REST semantics with a single deployment. If a feature genuinely requires a separate process (e.g. a worker queue), an ADR must be written first.

**tRPC**
- Rejected: tRPC endpoints are not REST — they are not callable from non-tRPC clients without a wrapper. Contradicts the external-access requirement.

**Supabase / Firebase / other managed backends**
- Rejected: violates the constitution's "no proprietary intermediary" principle. The database must be an asset the operator owns and can export.

## Consequences

- **Every feature now requires a Prisma schema entry, a migration, and a Route Handler** before UI work can be called done.
- **`.env.example` must be kept current.** Any new environment variable introduced by a feature must appear in `.env.example` with a comment explaining its purpose.
- **Placeholder implementations are forbidden.** If a feature is not yet full-stack, it is not complete — it should not be in `backlog/completed/` and it should not have a merged PR.
- **Mock data (`src/lib/mock-data.ts`) is for Storybook and UI scaffolding only.** It must not be the data source for any user-facing page once the feature is implemented.
