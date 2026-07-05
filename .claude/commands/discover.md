# /discover

Explore a project in this monorepo — its architecture, running state, and UI — and produce a structured discovery report.

---

## Arguments

```
/discover <project> [free-text query]
```

- `<project>` — required. Name of the app or package to explore (e.g. `stay`, `design-system`).
- `[free-text query]` — optional. What to look for. If omitted, explore freely based on all available context.

---

## What to do

### Step 1 — Parse arguments

Split `$ARGUMENTS` on the first whitespace boundary:
- First token → `PROJECT`
- Everything after → `QUERY` (may be empty)

If `$ARGUMENTS` is entirely empty, announce to the user:

```
> **Input needed:** Which project do you want to explore?
> Known projects: stay, design-system, web
> Re-run with: /discover <project> [optional: what to look for]
```

Then stop.

---

### Step 2 — Locate the project

Check whether the project exists. The known root paths are:

| Handle | Path |
|---|---|
| `stay` | `apps/stay/` |
| `web` | `apps/web/` |
| `design-system` | `packages/design-system/` |
| `stay-sdk` | `packages/stay-sdk/` |

Use Glob to verify the directory exists (`<path>/package.json`).

If it does **not** exist, announce:

```
> **Project not found:** "<PROJECT>" is not a recognised project in this monorepo.
> Known projects: stay, design-system, web, stay-sdk
```

Then stop.

---

### Step 3 — Load project context

Read the following files in parallel (skip gracefully if a file doesn't exist):

1. `CONSTITUTION.md` — repo-level mission and principles
2. `<path>/CLAUDE.md` — project-scoped rules and domain vocabulary
3. `<path>/package.json` — scripts, dependencies, version
4. `<path>/README.md` — if present

If the project is an app, also read `apps/CLAUDE.md`.

Summarise what you learned in a short internal note (not printed yet) covering:
- The project's stated purpose
- Key domain vocabulary
- Constitution constraints relevant to this project

---

### Step 4 — Determine discovery scope

#### If `QUERY` is provided

Focus the discovery on `QUERY`. Examples:
- "auth flow" → trace `src/lib/auth.ts`, `src/app/api/auth/**`, login/register pages
- "data model" → read `prisma/schema.prisma`, list models and relations
- "listings page" → read the listings route, its server component, and any API routes it calls

#### If `QUERY` is empty

Run a broad free exploration:
1. List all routes/pages (glob `src/app/**/page.tsx`)
2. List all API endpoints (glob `src/app/api/**/route.ts`)
3. List all Prisma models (read `prisma/schema.prisma` if present)
4. List all components (for `design-system`: glob `src/components/*/index.ts`)
5. Read `backlog/backlog.md` to understand current feature state
6. Note any obvious gaps or TODOs in code (search for `TODO`, `FIXME`, `MOCK`, `placeholder`)

---

### Step 5 — Static code exploration

Use Read, Grep, and Glob to explore the relevant files identified in Step 4. Collect facts:

- **Architecture:** how is the project structured? What patterns does it follow?
- **Data:** what entities exist? How do they relate?
- **API surface:** what endpoints are exposed? What do they accept/return?
- **UI routes:** what pages exist? What data do they display?
- **Auth:** how is authentication handled?
- **Gaps / TODOs:** what is stubbed, mocked, or missing?

Do not limit yourself to a fixed file list — follow the code. If a file imports something interesting, read it.

---

### Step 6 — Decide whether UI exploration is needed

UI exploration via Playwright is warranted when:
- `QUERY` mentions something visual (e.g. "the listing page", "what does the homepage look like", "the wizard flow")
- The static code alone cannot answer the question (e.g. dynamic data, conditional rendering)
- The project is an app (not a package), and a dev server can be started

If UI exploration is needed and the project has a dev server script:

**Announce to the user before starting the server:**

```
> **Action needed:** I'm about to start the dev server for <PROJECT> to explore the UI.
> Make sure port <PORT> is free. I'll stop the server when done.
> Press Enter in the terminal to continue, or cancel with Ctrl+C.
```

Wait for acknowledgement (the user will re-invoke or confirm in chat).

Once confirmed:

1. Identify the dev port from `package.json` scripts or `.env.example` (default: 3000).
2. Start the dev server in the background using Bash with `run_in_background: true`:
   ```bash
   pnpm --filter <package-name> dev
   ```
3. Wait ~5 seconds for the server to boot (use a short sleep or check readiness).
4. Use the Playwright MCP tool (if available) to:
   - Navigate to `http://localhost:<PORT>`
   - Take a screenshot of the landing page
   - Navigate to any routes mentioned in `QUERY`
   - Capture screenshots and note what is rendered
5. Stop the dev server when done.

If Playwright is not available, describe what you would explore and ask the user to share screenshots manually:

```
> **Input needed:** Playwright is not available in this session.
> Please navigate to http://localhost:<PORT> and share a screenshot,
> or describe what you see on the <PAGE> page.
```

---

### Step 7 — Produce the discovery report

Output a structured report. Tailor depth to what was found:

```markdown
## Discovery Report — <PROJECT>

**Date:** <today's date>
**Query:** <QUERY or "free exploration">

---

### Overview
<2–4 sentences: what this project is, its constitution alignment, current maturity>

### Architecture
<How the project is structured — layers, patterns, key conventions>

### Data Model
<Entities, relations, key fields — or "No Prisma schema found">

### API Surface
<List of Route Handlers with method and path — or "No API routes found">

### UI Routes
<List of pages with a one-line description of each>

### Auth
<How auth is handled, session strategy, protected routes>

### Current State
<What's built and working, what's stubbed or in progress — cross-reference backlog>

### Gaps & TODOs
<Stubbed implementations, MOCK data, FIXME comments, missing pieces>

### Constitution Alignment
<How well the project honours the relevant principles from CONSTITUTION.md>
<Flag any violations or risks>
```

If the discovery was focused on a `QUERY`, include an additional section:

```markdown
### Answer to: "<QUERY>"
<Direct answer, with file references and line numbers where relevant>
```

---

### Step 8 — Offer next steps

After the report, suggest 1–3 follow-up actions relevant to what was found. Examples:

- "There are 3 stubbed API routes — run `/tackle-backlog` to implement them."
- "The auth flow is missing email verification — see `backlog/todo/F-010-email-verification.md`."
- "Run `/audit-component ListingCard` — it has inline styles and no axe test."
- "The listings page uses `MOCK_LISTINGS` — this violates ADR-004. Flag for the next sprint."
