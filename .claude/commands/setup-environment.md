# /setup-environment

Guide the user through setting up their local development environment for this repo from scratch. Detect their OS and tailor every step accordingly. Be conversational — check in after each major step before proceeding.

---

## What to do

### Step 1 — Detect OS

Ask the user which OS they are on if not already known:

- **macOS** → use Homebrew / curl installer
- **Windows** → use winget or the MSI installer

---

### Step 2 — Install Volta

Volta pins Node and pnpm versions per-repo automatically (defined in `package.json`).

**macOS:**

```bash
curl https://get.volta.sh | bash
# Then restart your terminal, or run:
export VOLTA_HOME="$HOME/.volta"
export PATH="$VOLTA_HOME/bin:$PATH"
```

**Windows (winget):**

```powershell
winget install Volta.Volta
# Then restart your terminal to reload PATH
```

**Windows (MSI — if winget unavailable):**
Direct the user to download the installer from: `https://docs.volta.sh/guide/getting-started`

After install, verify:

```bash
volta --version   # should print e.g. 2.x.x
```

---

### Step 3 — Install jq

`jq` is a lightweight command-line JSON processor used by Claude Code hooks to parse tool output.

**macOS:**

```bash
brew install jq
```

**Windows (winget):**

```powershell
winget install jqlang.jq
# Restart terminal to reload PATH
```

**Windows (winget unavailable — manual install):**

```bash
# Download the binary directly into a directory already on your PATH
curl -L https://github.com/jqlang/jq/releases/latest/download/jq-windows-amd64.exe \
  -o "$USERPROFILE/AppData/Local/Microsoft/WindowsApps/jq.exe"
```

Verify:

```bash
jq --version   # jq-1.8.x
```

---

### Step 4 — Install Node and pnpm via Volta

Volta reads the `volta` field in `package.json` and pins automatically on first use. Run:

```bash
volta install node@24.14.0
volta install pnpm@10.32.1
```

Verify:

```bash
node -v    # v24.14.0
pnpm -v    # 10.32.1
```

---

### Step 5 — Install GitHub CLI and authenticate

The GitHub CLI (`gh`) is required for creating PRs, reviewing issues, and Claude Code's git identity features.

**macOS (Homebrew):**

```bash
brew install gh
```

**Windows (winget):**

```powershell
winget install GitHub.cli
# Restart terminal to reload PATH
```

After install, verify:

```bash
gh --version   # should print gh version 2.x.x
```

**Authenticate:**

```bash
gh auth login
```

Follow the prompts:

1. Select **GitHub.com**
2. Select **HTTPS** as the preferred protocol
3. Select **Login with a web browser** (or paste a token if on a headless machine)
4. Copy the one-time code shown, press Enter — your browser will open
5. Paste the code and authorise the app

Verify authentication:

```bash
gh auth status
# Expected: Logged in to github.com as <your-username>
```

---

### Step 6 — Install dependencies

```bash
pnpm install
```

Expected: no errors, lockfile unchanged.

---

### Step 7 — Install Playwright Chromium

The pre-push hook runs Storybook a11y checks using a headless browser (Playwright). Install the browser once after cloning:

```bash
pnpm --filter @public-internet/design-system exec playwright install chromium
```

This downloads Chromium (~170 MB) to your local Playwright cache. You only need to do this once per machine, and again after any Playwright version upgrade.

---

### Step 8 — Verify lifecycle gates

```bash
pnpm lint       # ESLint — should pass
pnpm typecheck  # tsc --noEmit — should pass
pnpm build      # Turbo build — should pass
```

---

### Step 9 — Verify git hooks

Test that the commit-msg hook rejects bad messages:

```bash
git commit --allow-empty -m "bad message"
# Expected: rejected with "Commit message rejected" error

git commit --allow-empty -m "chore(setup): verify hooks work"
# Expected: passes — then git reset HEAD~1 to undo the test commit
```

---

### Troubleshooting

| Problem                                   | Fix                                                                                                  |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `jq: command not found`                   | On Windows, re-run the curl install step or open a new terminal; confirm with `where jq`             |
| `volta: command not found` after install  | Restart terminal or re-source your shell profile (`~/.zshrc`, `~/.bashrc`, or open a new PowerShell) |
| `pnpm: command not found`                 | Run `volta install pnpm@10.32.1` again                                                               |
| `pnpm install` fails with frozen lockfile | Run `pnpm install --no-frozen-lockfile` once, then commit the updated lockfile                       |
| Husky hooks not running                   | Run `pnpm exec husky` to reinitialise                                                                |
| `node -v` shows wrong version             | Make sure you're inside the repo directory — Volta switches versions per-project                     |
| `gh: command not found`                   | Restart terminal after install; on Windows confirm `gh` is on PATH via `where gh`                    |
| `gh auth login` opens wrong browser       | Use `gh auth login --web` or `gh auth login --with-token` with a PAT instead                         |
| `gh auth status` shows "not logged in"    | Re-run `gh auth login`; ensure you authorised the correct GitHub account                             |
| Playwright fails after dep upgrade        | Re-run the Playwright install command — the browser binary version may have changed                  |

---

### Done

When all steps pass, confirm to the user:

- Volta is managing Node and pnpm versions for this repo
- GitHub CLI is installed and authenticated
- Pre-commit hooks are enforcing lint + conventional commits
- They're ready to start on the backlog — suggest checking `backlog/backlog.md`
