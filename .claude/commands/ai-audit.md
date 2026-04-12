# /ai-audit

Audit AI-generated code against project rules (CONSTITUTION.md, design system conventions, and app composition rules). Companion to `/rules-audit`, which audits the rules themselves — this command audits the *code* produced under those rules.

**Usage:**
```
/ai-audit              # current git diff (staged + unstaged)
/ai-audit <path>       # specific file or directory
/ai-audit --pr         # all changes on the current branch vs. main
```

---

## What to do

### Step 1 — Resolve scope

Parse `$ARGUMENTS`:

- **No argument** → scope is the current git diff (staged + unstaged):
  ```bash
  git diff HEAD
  ```
- **`--pr`** → scope is all changes on the current branch vs. `main`:
  ```bash
  git diff main...HEAD
  ```
- **A file or directory path** → scope is that path only. Read the file(s) with the Read tool.

Collect the set of files to audit. For git diffs, extract changed file paths from the diff header lines (`+++ b/<path>`). For path arguments, use Glob to list files.

---

### Step 2 — GROUP 1: Constitution (judgment)

Read `CONSTITUTION.md` in full before scoring. Then for each changed file, evaluate:

| Check | PASS condition |
|---|---|
| **Value direction** | Feature delivers value to users; does not extract it through commissions, lock-in, or manufactured dependency |
| **Exit freedom** | Makes leaving easier, not harder — no proprietary data formats, no export barriers |
| **Public governance** | A public entity or cooperative could operate this feature without a private intermediary |
| **Federation safety** | Data schema is exportable and not vendor-locked (no opaque IDs tied to a single provider) |
| **Worker compliance** | Worker-facing features include transparent pay, an appeal path, and no easy deactivation without due process |
| **No dark patterns** | No urgency/scarcity copy ("Only 2 left!"), no pre-ticked opt-ins, no hidden fees, no confirmshaming |
| **Platform scope** | Feature is within the Platform Registry in CONSTITUTION.md — not a new platform added without process |

Score each check as ✅ PASS, ❌ FAIL, or ⚠️ WARN (uncertain — flag for human review). Constitution checks are judgment calls; be explicit about your reasoning in any FAIL or WARN.

---

### Step 3 — GROUP 2: Design system (automated)

For files in `packages/design-system/` or any `.module.css` file:

Run the following grep checks on the relevant file content:

| Check | Pattern to fail on | Severity |
|---|---|---|
| **No hardcoded colours** | `#[0-9a-fA-F]{3,6}` in `.module.css` | ❌ FAIL |
| **No hardcoded px font sizes** | `font-size:\s*\d+px` in `.module.css` | ❌ FAIL |
| **No hardcoded font weights** | `font-weight:\s*\d{3}` in `.module.css` | ❌ FAIL |
| **No inline styles** | `style=\{\{` in `.tsx` component files | ❌ FAIL |
| **No Tailwind classes** | `className="[^"]*\b(bg-|text-|px-|py-|flex|grid|rounded)\b` in any component file | ❌ FAIL |
| **No `any` types** | `:\s*any\b` or `as any` in `.ts`/`.tsx` files | ⚠️ WARN |
| **No console.log** | `console\.log` in `.ts`/`.tsx` files | ❌ FAIL |

Use Grep to check each pattern in the scoped files. Report every match with file path and line number.

**Auto-fix offered:** After reporting, offer to remove all `console.log` statements automatically. If the user confirms, use Edit to remove each occurrence.

---

### Step 4 — GROUP 3: App composition (automated)

For files in `apps/`:

| Check | Pattern to fail on | Severity |
|---|---|---|
| **No relative cross-package imports** | `from ['"](\.\./)+packages/` in any app file | ❌ FAIL |
| **No one-off DS wrappers** | Component defined in `apps/` whose name matches an existing DS component (`Button`, `Input`, `Card`, etc.) | ⚠️ WARN |
| **GAP comments required** | Any workaround for a missing DS component must have a `// GAP:` or `{/* GAP: */}` comment — scan for native `<select>`, `<textarea>`, `<input type="checkbox">` and `<input type="radio">` without adjacent GAP comments | ⚠️ WARN |

For the one-off wrapper check, read `packages/design-system/CLAUDE.md` § Available Components to get the current list of DS component names.

---

### Step 5 — GROUP 4: Lifecycle gates

Run each gate and capture the exit code:

```bash
pnpm type-check
pnpm lint
pnpm build
pnpm --filter @public-internet/design-system test:coverage
```

| Gate | Pass condition | Severity |
|---|---|---|
| **TypeScript** | `pnpm type-check` exits 0 | ❌ FAIL |
| **ESLint** | `pnpm lint` exits 0 | ❌ FAIL |
| **Build** | `pnpm build` exits 0 | ❌ FAIL |
| **Coverage** | `pnpm --filter @public-internet/design-system test:coverage` exits 0 (≥70% threshold) | ❌ FAIL |

If any gate fails, show the relevant error output (not the full log — just the failing lines).

**Auto-fix offered for gate failures:** Offer to investigate and fix TypeScript or ESLint errors if they are straightforward (missing types, unused imports). Do not attempt to auto-fix build or coverage failures without user confirmation.

---

### Step 6 — Print the report

Use this exact format:

```
/ai-audit — <scope description>

  GROUP 1  Constitution
    ✅  Value direction
    ✅  Exit freedom
    ✅  Public governance
    ✅  Federation safety
    ✅  Worker compliance
    ✅  No dark patterns
    ✅  Platform scope

  GROUP 2  Design system
    ✅  No hardcoded colours
    ✅  No hardcoded px font sizes
    ✅  No hardcoded font weights
    ✅  No inline styles
    ✅  No Tailwind classes
    ⚠️  No `any` types         — Button.tsx:14 (as any)
    ✅  No console.log

  GROUP 3  App composition
    ✅  No relative cross-package imports
    ✅  No one-off DS wrappers
    ⚠️  GAP comments required  — signin/page.tsx:34 native <input type="checkbox"> without GAP comment

  GROUP 4  Lifecycle gates
    ✅  TypeScript
    ✅  ESLint
    ✅  Build
    ✅  Coverage
```

After the report, list every ❌ FAIL item with file, line, and specific fix instruction.

---

### Step 7 — Enforce

**If any ❌ FAIL items remain:** tell the user explicitly — "These failures must be resolved before opening a PR." Offer to fix each one.

**If only ⚠️ WARN items remain:** note them but confirm the user may proceed to `/create-pr`.

**If all checks pass:** confirm — "All checks pass. You're clear to run `/create-pr`."
