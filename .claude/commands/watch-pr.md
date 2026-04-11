# /watch-pr

Monitor the CI status of the current branch's Pull Request. Poll until all checks pass or fail, then report and act.

---

## What to do

### Step 1 — Find the PR

```bash
gh pr view --json number,url,state,title,headRefName
```

If no PR exists for the current branch, tell the user and offer to create one (`gh pr create`).

### Step 1.5 — Check for merge conflicts

Before polling CI, check the PR's mergeability:

```bash
gh pr view --json mergeable,mergeStateStatus
```

**If `mergeable` is `CONFLICTING`:**

1. The branch has conflicts with main — resolve them before CI matters.
2. Run `git fetch origin main && git merge origin/main` to bring in the latest main.
3. Check which files conflict: `git diff --name-only --diff-filter=U`
4. Resolve each conflict using `Edit`:
   - Keep the feature branch's change unless the base introduced a token, convention, or structural update that should take precedence.
   - For `pnpm-lock.yaml`: run `git checkout --theirs pnpm-lock.yaml && pnpm install --no-frozen-lockfile` to regenerate it.
5. Stage resolved files and commit the merge: `git commit -m "chore(merge): merge main into <branch>"`
6. Push the branch — CI will re-trigger.
7. Continue to Step 2.

**If `mergeable` is `MERGEABLE` or `UNKNOWN`:** proceed to Step 2.

### Step 2 — Poll CI checks and PR status together

```bash
gh pr checks --watch --interval 30
```

While waiting (or after each 30-second interval), also poll the PR mergeability:

```bash
gh pr view --json mergeable,mergeStateStatus
```

**If `mergeable` becomes `CONFLICTING` during polling:**

Stop the CI wait — conflicts must be resolved first, then CI re-runs. Go back to Step 1.5.

### Step 3 — Interpret the final result

After `gh pr checks --watch` exits:

```bash
gh pr checks
gh pr view --json mergeable,mergeStateStatus
```

Check both CI status and merge status.

**If all checks pass AND `mergeable` is `MERGEABLE`:**
Tell the user: "All CI checks passed — the PR is ready to review and merge."

**If any CI check fails:**

1. Show which check failed and what the error was (`gh run view <run-id> --log-failed`)
2. Diagnose the failure from the log
3. Fix the root cause in the code
4. Commit the fix on the same branch — the push will re-trigger CI
5. Re-run `/watch-pr` to monitor the new run

**If `mergeable` is `CONFLICTING` (even if CI passed):**

1. Run `git fetch origin main && git merge origin/main` to bring in the latest main
2. Check conflicting files: `git diff --name-only --diff-filter=U`
3. Resolve each conflict using `Edit` — keep the feature branch's change unless the base introduced a token, convention, or structural update
4. For `pnpm-lock.yaml`: run `git checkout --theirs pnpm-lock.yaml && pnpm install --no-frozen-lockfile`
5. Commit the merge resolution
6. Push — CI will re-trigger
7. Re-run `/watch-pr`

### Step 4 — Done

Once CI passes and `mergeable` is `MERGEABLE`, notify the user. Do not merge the PR unless the user explicitly asks.
