# /create-pr

Create a Pull Request for the current branch, then monitor CI until it passes.

---

## What to do

### Step 1 — Confirm audit status

Before creating a PR for any new or modified component, confirm that `/audit-component` has been run and all critical checks pass.

Ask the user: "Have you run `/audit-component <ComponentName>` for any new or modified components? Did all 5 automated checks pass (or have failures been acknowledged)?"

- If audit passed: proceed to Step 2.
- If audit was not run: offer to run `/audit-component <ComponentName>` now. Resolve all ❌ FAIL items before continuing.
- If failures were acknowledged by the user: note them in the PR description and continue.

### Step 2 — Verify branch

```bash
git rev-parse --abbrev-ref HEAD
```

If on `main`, stop and tell the user: "You are on the main branch. Create a feature branch first with `git checkout -b feature/description`."

### Step 3 — Ensure changes are committed

```bash
git status
```

If there are uncommitted changes, ask the user if they want to commit them before opening the PR. If yes, stage and commit with an appropriate message.

### Step 4 — Sync with main before pushing

Check whether the branch is behind main and resolve any conflicts before creating the PR:

```bash
git fetch origin main
git merge origin/main
```

**If there are conflicts:**

1. Check conflicting files: `git diff --name-only --diff-filter=U`
2. Resolve each one with `Edit` — keep the feature branch's change unless the base introduced a token, convention, or structural update.
3. For `pnpm-lock.yaml`: run `git checkout --theirs pnpm-lock.yaml && pnpm install --no-frozen-lockfile`.
4. Commit the resolution: `git commit -m "chore(merge): merge main into <branch>"`

**If there are no conflicts:** proceed directly to push.

```bash
git push -u origin HEAD
```

### Step 5 — Check for existing PR

```bash
gh pr view --json number,url 2>/dev/null
```

If a PR already exists, skip to Step 6.

### Step 6 — Create the PR

Use the PR template from `.github/pull_request_template.md` if it exists. Fill in:

- **Title:** concise, follows conventional commits style (`feat:`, `fix:`, `chore:`)
- **Body:** fill in the template sections based on what changed

```bash
gh pr create --title "<title>" --body "<filled template>" --base main
```

### Step 7 — Monitor CI

After the PR is created (or already exists), immediately run `/watch-pr` to monitor CI status.
