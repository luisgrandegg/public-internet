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

**If all checks pass AND `mergeable` is `MERGEABLE`:** proceed to Step 3.5.

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

---

### Step 3.5 — Resolve outstanding review comments

CI passed and the branch is mergeable. Before declaring done, check for unresolved review feedback:

```bash
gh api repos/OWNER/REPO/pulls/PR_NUMBER/reviews
gh api repos/OWNER/REPO/pulls/PR_NUMBER/comments
```

**Determine which reviews need action:**

- Collect all reviews where `state` is `CHANGES_REQUESTED`.
- For each such review, also fetch its individual comments (the `/comments` response already contains all inline comments for all reviews; filter by `pull_request_review_id`).
- Skip any review submitted by the same login as the PR author (`user.login` from the PR metadata) — a self-review is informational, not a blocker.
- If no reviews have `state: CHANGES_REQUESTED`, skip to Step 4.

**For each unresolved inline comment:**

Read the `path` and `line` fields to locate the exact file and line being flagged. Read the full file with the Read tool, then apply the fix using Edit:

- If the comment body contains a code block, use that code as the replacement.
- If the comment describes a change in prose, interpret it and apply the minimal fix that satisfies the request.
- If the fix is ambiguous or requires a design decision, skip it and flag it to the user at the end.

**For each top-level review body (no specific line):**

Read the overall review `body`. Apply any actionable changes across the relevant files. If the body is purely informational (no concrete ask), skip it.

**After applying all fixes:**

1. Commit all changes in one commit:
   ```bash
   git add <changed files>
   git commit -m "fix(review): address PR review comments"
   ```
2. Push the branch — CI will re-trigger.
3. Re-run `/watch-pr` from Step 2 to monitor the new CI run and confirm no new review issues remain.

**If some comments were skipped** (ambiguous or design decisions), report them clearly to the user after the CI loop completes so they can handle them manually.

---

### Step 4 — Done

Once CI passes, `mergeable` is `MERGEABLE`, and there are no outstanding `CHANGES_REQUESTED` reviews, notify the user:

"All CI checks passed and all review comments have been addressed — the PR is ready to merge."

Do not merge the PR unless the user explicitly asks.
