# /review-pr

Perform a thorough code review on a Pull Request, post an inline comment for each finding, and submit the review requesting changes.

**Usage:** `/review-pr <PR>` where `<PR>` is one of:
- A full GitHub PR URL: `https://github.com/owner/repo/pull/123`
- A shorthand repo + number: `owner/repo#123`
- A plain PR number (uses current repo): `123`

---

## What to do

### Step 1 — Parse the PR reference

From `$ARGUMENTS`, extract:
- `OWNER` — GitHub org or username
- `REPO` — repository name
- `PR_NUMBER` — pull request number

**Parsing rules:**

- If it matches `https://github.com/<owner>/<repo>/pull/<number>`, extract all three.
- If it matches `<owner>/<repo>#<number>`, extract all three.
- If it is a plain integer, set `PR_NUMBER` to that integer and resolve `OWNER`/`REPO` from the current repo:
  ```bash
  gh repo view --json owner,name
  ```

If the input is empty or cannot be parsed, ask the user: "Please provide a PR reference — a GitHub URL, `owner/repo#number`, or a plain PR number."

---

### Step 2 — Fetch PR metadata

```bash
gh api repos/OWNER/REPO/pulls/PR_NUMBER
```

Record:
- `title` — PR title
- `body` — PR description
- `head.sha` — head commit SHA (needed for review comments)
- `base.ref` — base branch
- `head.ref` — feature branch
- `user.login` — PR author

If the PR is not found (404), tell the user and stop.

---

### Step 3 — Fetch the changed files and diff

```bash
gh api repos/OWNER/REPO/pulls/PR_NUMBER/files
```

This returns an array of file objects. For each file, record:
- `filename` — relative path
- `status` — `added`, `modified`, `removed`, `renamed`
- `patch` — the unified diff hunk (may be absent for binary files or very large diffs)

Then read the full content of each changed file (non-binary, non-removed) using the Read tool. Use the filename directly — it is relative to the repo root.

If a file is too large to read fully, read the changed hunks from `patch` only.

---

### Step 4 — Fetch PR comments and existing reviews

Check what has already been flagged so you don't duplicate findings:

```bash
gh api repos/OWNER/REPO/pulls/PR_NUMBER/comments
gh api repos/OWNER/REPO/pulls/PR_NUMBER/reviews
```

---

### Step 5 — Perform the review

Review every changed file against the criteria below. For each finding, record:

- `path` — file path (exactly as returned by the files API)
- `line` — the line number in the **right (new) side** of the file where the issue is located; use the last line of the problem if it spans multiple lines
- `side` — always `"RIGHT"` for lines in the new version of the file
- `summary` — one sentence: what is wrong
- `detail` — concrete solution: what to change and how

**Review criteria (check all that apply):**

**TypeScript / correctness**
- `any` types or implicit `any` — require explicit types
- Missing return types on exported functions
- Non-null assertions (`!`) without a justifying comment
- `as` casts that bypass safety (prefer type guards)
- Unused imports or variables

**Design system conventions** (for files in `packages/design-system/`)
- Hardcoded hex colors or raw `px` values — must use `var(--ds-*)` tokens
- Inline `style={{}}` props — must use CSS Modules
- Tailwind classes — not allowed
- Missing `className` prop pass-through for external overrides
- Missing or incomplete Storybook stories (< 3 named exports)
- Missing accessibility test (`toHaveNoViolations`)

**Security**
- `dangerouslySetInnerHTML` without sanitization
- `eval()` or `new Function()`
- User-controlled values interpolated into URLs or SQL without encoding

**Code quality**
- `console.log` left in production code
- Dead code or commented-out blocks
- Logic that can be simplified significantly
- Missing error handling at system boundaries (API calls, file I/O)

**Testing**
- Tests using `getByTestId` instead of semantic queries
- `fireEvent` instead of `userEvent` for interactions
- Assertions on class names or implementation details

**Do not flag:**
- Style preferences (formatting, naming conventions) that are enforced by the linter
- Issues already flagged in existing review comments or reviews
- Files with `status: "removed"` — no changes needed on deleted files

---

### Step 6 — Self-assign as reviewer

Resolve the current GitHub user and attempt to add them as a reviewer:

```bash
CURRENT_USER=$(gh api user --jq .login)
```

If `CURRENT_USER` is empty (token lacks `user` scope or the call failed), log "Warning: could not resolve GitHub username — skipping self-assignment" and continue.

If `CURRENT_USER` is non-empty, post the reviewer request:

```bash
gh api repos/OWNER/REPO/pulls/PR_NUMBER/requested_reviewers \
  --method POST \
  --field "reviewers[]=$CURRENT_USER"
```

If this returns 422 `"Review cannot be requested from pull request author"`, log "Skipping self-assignment — you are the PR author" and continue. Any other error: report it and stop.

Also compare `CURRENT_USER` against `user.login` from Step 2. If they match, set `IS_AUTHOR=true`; otherwise `IS_AUTHOR=false`.

If there are **no findings**, tell the user: "No issues found in this PR. You've been added as a reviewer — submit an approval manually if you're satisfied." Stop without posting any review.

---

### Step 7 — Build and post the review

If there are findings, determine the review event:

- If `IS_AUTHOR=false`: use `"event": "REQUEST_CHANGES"`
- If `IS_AUTHOR=true`: use `"event": "COMMENT"` and prepend this sentence to the review `body`: _"Findings posted as comments — REQUEST_CHANGES is not available when the reviewer is the PR author."_

Build the JSON payload and pipe it directly to `gh api` via stdin heredoc (do **not** write to a temp file — `/tmp` is not reliably accessible on all platforms):

```bash
gh api repos/OWNER/REPO/pulls/PR_NUMBER/reviews \
  --method POST \
  --input - <<'REVIEW_EOF'
{
  "event": "<REQUEST_CHANGES or COMMENT>",
  "commit_id": "<HEAD_SHA from Step 2>",
  "body": "<overall summary — 2–4 sentences covering the main themes across all findings>",
  "comments": [
    {
      "path": "<path>",
      "line": <line>,
      "side": "RIGHT",
      "body": "**Issue:** <summary>\n\n**Suggestion:** <detail>\n\n---\n*Co-authored-by: Claude Sonnet 4.6 <noreply@anthropic.com>*"
    }
  ]
}
REVIEW_EOF
```

Rules for the payload:
- `commit_id` must be set to the `head.sha` value recorded in Step 2 — this anchors comments to the correct commit.
- `body` at the top level is the overall review summary — not a list; write it as prose.
- Each comment `body` must contain the issue description, the concrete suggestion, and the `Co-authored-by` attribution footer, exactly as shown in the template above.
- `line` must be an integer (no quotes). Verify each line number is within the file's current line count — if uncertain, use the last line of the relevant hunk from the `patch`.
- Include every finding as a separate comment. Do not merge multiple issues into one comment.

If the API returns an error:
- **422 with `"pull_request_review_thread.line is not part of the diff"`** — a comment references a line outside the diff. Re-read the patch for that file, correct the line number to one present in the hunk, rebuild the heredoc, and retry once.
- **404 Not Found** — the PR was not found or you lack access. Report to the user and stop.
- Any other error — show the full error message to the user and stop.

---

### Step 8 — Confirm and report

After a successful post, tell the user:

```
Review submitted on PR #PR_NUMBER — <REQUEST_CHANGES or COMMENT>

  N comments posted:
  - path/to/file.ts:42 — <one-line summary>
  - path/to/other.ts:17 — <one-line summary>
  ...

  View the review: https://github.com/OWNER/REPO/pull/PR_NUMBER
```

Do not re-read the review after posting. The API response confirms success.
