# /voice-changes

Apply the most recent voice-dictated change spec from `.voice-changes/` to the current branch. This is the Claude Code half of the voice-first toolchain (the other half is the `apps/voice-bridge` app — see [ADR-005](../../decisions/ADR-005-voice-input-via-elevenlabs.md)).

---

## What to do

### Step 1 — Verify branch

```bash
git rev-parse --abbrev-ref HEAD
```

If on `main`, stop and tell the user: "You are on the main branch. Voice changes apply to feature branches only — create one with `git checkout -b feature/description`."

### Step 2 — Find the newest spec

List the spec directory and pick the file with the most recent `mtime`:

```bash
ls -t .voice-changes/*.md 2>/dev/null | head -1
```

If the directory is empty (or doesn't exist), stop and tell the user: "No voice specs found in `.voice-changes/`. Open `apps/voice-bridge` (`pnpm --filter @public-internet/voice-bridge dev`), record a session, and try again."

### Step 3 — Read and confirm

Read the spec file and summarise it for the user in one paragraph:

- The PR number in the spec header
- The summary line
- The list of files about to change (one bullet per `### N. \`<file>\`` block)

Then ask:

> "Apply these N change(s) to <files>? Reply yes to proceed, or no to cancel."

If the user says no, stop without modifying anything.

### Step 4 — Apply each change

For each `### N. \`<file>\`` block in the spec:

1. Read the file with `Read`.
2. Apply the change using `Edit`.
   - If the block contains a fenced ```diff``` block, use it to construct the `old_string` / `new_string` pair.
   - If the block contains only prose (`description` + `rationale`), interpret the prose and apply the minimal change that satisfies it. If the intent is ambiguous, stop and ask the user before guessing.
3. After editing, re-read the file briefly to confirm the change is consistent with surrounding code (no broken imports, no dangling JSX).

If a block targets a file that does not exist, treat it as a creation request only when the description explicitly says "create" or "new file." Otherwise stop and flag the missing file.

### Step 5 — Run the local gates

```bash
pnpm type-check
pnpm lint
```

If either fails, fix the failure on the same branch — the voice spec is intent, not contract; the project's gates are the contract.

### Step 6 — Run /audit-component if a design system component changed

If any of the modified files is under `packages/design-system/src/components/`, run `/audit-component <ComponentName>` for each one. Resolve any ❌ FAIL items before proceeding.

### Step 7 — Commit

Stage the modified files (not the spec file) and commit with a message that references the voice session:

```bash
git add <changed files>
git commit -m "feat(voice): apply spec from .voice-changes/<file>"
```

Then **archive the spec** so it is not re-applied next time:

```bash
mv .voice-changes/<file> .voice-changes/applied/<file>
```

> Use the `Write` tool to copy the file to `.voice-changes/applied/<file>` and the `Bash` tool with `git rm --cached` only if the file was previously tracked. Spec files are gitignored, so simply moving the file with `mv` is fine; if `mv` is not allowed by the shell allow-list, use `Read` + `Write` + delete.

### Step 8 — Hand off to /watch-pr

If the user already has an open PR for this branch, recommend running `/watch-pr` next:

> "Spec applied and committed. Run `/watch-pr` to monitor CI, or `/create-pr` if no PR exists yet."

Do not run `/create-pr` automatically — voice sessions can produce intermediate work that the user wants to combine with a typed-prompt session before opening a PR.

---

## Failure modes to watch for

- **Spec proposes a change that conflicts with the constitution** (e.g. urgency copy, hidden fees). Refuse the change and report it back to the user with the principle that blocked it. Do not silently apply.
- **Spec is ambiguous** ("make it pop"). Ask one clarifying question. If still ambiguous, stop and tell the user to re-record with more specificity rather than guessing.
- **Multiple specs newer than the last commit.** Apply only the newest unless the user asks otherwise — older specs may be stale.
