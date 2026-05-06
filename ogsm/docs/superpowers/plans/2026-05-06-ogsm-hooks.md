# OGSM Hook Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add four Claude Code shell hooks that enforce OGSM storage safety on Claude Code without changing Codex behaviour.

**Architecture:** Each hook script reads Claude Code's JSON hook payload from stdin, checks whether the event involves `.ogsm/` paths, and either passes through (exit 0) or emits warnings/blocks (exit 2 for H1). SKILL.md is unchanged so Codex continues to rely on its text instructions. `.claude/settings.json` at the repo root wires the hooks to Claude Code.

**Tech Stack:** Node.js (built-ins only: `fs`, `os`, `path`, `child_process`), POSIX shell for test-scripts.sh additions.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `ogsm/scripts/hooks/pre-write-validate-profile.js` | H1: validate profile content before Write |
| Create | `ogsm/scripts/hooks/post-write-confirm.js` | H2: confirm written `.ogsm/` files are valid/non-empty |
| Create | `ogsm/scripts/hooks/post-context-check.js` | H3: check context file after update-operating-context.js |
| Create | `ogsm/scripts/hooks/stop-reminder.js` | H4: remind user of unsaved OGSM changes on Stop |
| Create | `.claude/settings.json` | Claude Code hook wiring (repo-root level) |
| Modify | `ogsm/scripts/test-scripts.sh` | Add hook smoke tests |
| Modify | `ogsm/scripts/validate-architecture.sh` | Add hook file + settings.json presence checks |

---

### Task 1: Scaffold hook directory, stub scripts, and settings.json

**Files:**
- Create: `ogsm/scripts/hooks/pre-write-validate-profile.js`
- Create: `ogsm/scripts/hooks/post-write-confirm.js`
- Create: `ogsm/scripts/hooks/post-context-check.js`
- Create: `ogsm/scripts/hooks/stop-reminder.js`
- Create: `.claude/settings.json`

- [ ] **Step 1: Create four stub hook scripts**

Each stub reads stdin to EOF and exits 0. This lets us verify the scaffold before any logic is added.

`ogsm/scripts/hooks/pre-write-validate-profile.js`:
```javascript
#!/usr/bin/env node
const chunks = [];
process.stdin.on('data', (d) => chunks.push(d));
process.stdin.on('end', () => { process.exit(0); });
```

`ogsm/scripts/hooks/post-write-confirm.js`:
```javascript
#!/usr/bin/env node
const chunks = [];
process.stdin.on('data', (d) => chunks.push(d));
process.stdin.on('end', () => { process.exit(0); });
```

`ogsm/scripts/hooks/post-context-check.js`:
```javascript
#!/usr/bin/env node
const chunks = [];
process.stdin.on('data', (d) => chunks.push(d));
process.stdin.on('end', () => { process.exit(0); });
```

`ogsm/scripts/hooks/stop-reminder.js`:
```javascript
#!/usr/bin/env node
const chunks = [];
process.stdin.on('data', (d) => chunks.push(d));
process.stdin.on('end', () => { process.exit(0); });
```

- [ ] **Step 2: Make all four scripts executable**

```bash
chmod +x ogsm/scripts/hooks/pre-write-validate-profile.js
chmod +x ogsm/scripts/hooks/post-write-confirm.js
chmod +x ogsm/scripts/hooks/post-context-check.js
chmod +x ogsm/scripts/hooks/stop-reminder.js
```

- [ ] **Step 3: Create `.claude/settings.json`**

Path is at the repository root (`superpowers-brainstorming-users-breakingmind-codex-plugins/.claude/settings.json`), one level above `ogsm/`.

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "node ogsm/scripts/hooks/pre-write-validate-profile.js"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "node ogsm/scripts/hooks/post-write-confirm.js"
          }
        ]
      },
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node ogsm/scripts/hooks/post-context-check.js"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node ogsm/scripts/hooks/stop-reminder.js"
          }
        ]
      }
    ]
  }
}
```

- [ ] **Step 4: Verify stubs pass smoke test**

```bash
echo '{}' | node ogsm/scripts/hooks/pre-write-validate-profile.js && echo "H1 stub ok"
echo '{}' | node ogsm/scripts/hooks/post-write-confirm.js && echo "H2 stub ok"
echo '{}' | node ogsm/scripts/hooks/post-context-check.js && echo "H3 stub ok"
echo '{}' | node ogsm/scripts/hooks/stop-reminder.js && echo "H4 stub ok"
```

Expected: four lines each ending with `ok`.

- [ ] **Step 5: Commit scaffold**

```bash
git add ogsm/scripts/hooks/ .claude/settings.json
git commit -m "feat: scaffold hook scripts and settings.json"
```

---

### Task 2: Implement H1 — pre-write-validate-profile.js

**Files:**
- Modify: `ogsm/scripts/hooks/pre-write-validate-profile.js`

H1 blocks writes to `.ogsm/profiles/**` when content fails `validate-profile.js`. All other paths pass through immediately.

- [ ] **Step 1: Write the failing test in a temp script**

Save the following as `/tmp/test-h1.sh` and run it to confirm the stub does NOT yet block invalid profiles:

```bash
#!/bin/sh
set -eu
script_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
hook="$(pwd)/ogsm/scripts/hooks/pre-write-validate-profile.js"

# Non-.ogsm/profiles path → always pass
echo '{"tool_input":{"file_path":"README.md","content":"anything"}}' | node "$hook"
echo "PASS: non-profile path"

# Invalid profile → should exit non-zero (currently exits 0 with stub)
payload='{"tool_input":{"file_path":".ogsm/profiles/company/test.md","content":"# Bad\n\nNo sections."}}'
if echo "$payload" | node "$hook"; then
  echo "FAIL: invalid profile was not blocked (expected non-zero exit)"
  exit 1
fi
echo "PASS: invalid profile blocked"
```

Run:
```bash
sh /tmp/test-h1.sh
```

Expected: `PASS: non-profile path` then `FAIL: invalid profile was not blocked` — the second assertion fails on the stub, confirming the test is correctly detecting missing behaviour.

- [ ] **Step 2: Implement H1**

Replace `ogsm/scripts/hooks/pre-write-validate-profile.js` with:

```javascript
#!/usr/bin/env node
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const chunks = [];
process.stdin.on('data', (d) => chunks.push(d));
process.stdin.on('end', () => {
  let input;
  try {
    input = JSON.parse(Buffer.concat(chunks).toString());
  } catch {
    process.exit(0);
  }

  const filePath = input?.tool_input?.file_path ?? '';
  if (!filePath.includes('.ogsm/profiles/')) {
    process.exit(0);
  }

  const content = input?.tool_input?.content ?? '';
  const tmp = path.join(os.tmpdir(), `ogsm-pre-validate-${Date.now()}.md`);

  try {
    fs.writeFileSync(tmp, content);
    const validateScript = path.resolve(__dirname, '..', 'validate-profile.js');
    execFileSync('node', [validateScript, tmp], { stdio: ['ignore', 'pipe', 'pipe'] });
    process.exit(0);
  } catch (err) {
    let message = 'OGSM pre-write validation failed';
    try {
      const result = JSON.parse(err.stdout?.toString() ?? '{}');
      if (Array.isArray(result.missing) && result.missing.length > 0) {
        message += ': missing sections: ' + result.missing.join(', ');
      }
    } catch {}
    process.stderr.write(message + '\n');
    process.exit(2);
  } finally {
    try { fs.unlinkSync(tmp); } catch {}
  }
});
```

- [ ] **Step 3: Run the test again to verify it passes**

```bash
sh /tmp/test-h1.sh
```

Expected:
```
PASS: non-profile path
PASS: invalid profile blocked
```

- [ ] **Step 4: Also verify a valid profile passes**

```bash
valid_content="$(node -e "process.stdout.write(JSON.stringify(require('fs').readFileSync('ogsm/examples/sample-ogsm-profile.md','utf8')))")"
printf '{"tool_input":{"file_path":".ogsm/profiles/company/test.md","content":%s}}' "$valid_content" | \
  node ogsm/scripts/hooks/pre-write-validate-profile.js && echo "PASS: valid profile allowed"
```

Expected: `PASS: valid profile allowed`

- [ ] **Step 5: Commit**

```bash
git add ogsm/scripts/hooks/pre-write-validate-profile.js
git commit -m "feat: implement H1 pre-write profile validation hook"
```

---

### Task 3: Implement H2 — post-write-confirm.js

**Files:**
- Modify: `ogsm/scripts/hooks/post-write-confirm.js`

H2 runs after a Write. For `.ogsm/profiles/**` it re-validates the saved file. For other `.ogsm/**` files it checks the file is non-empty. PostToolUse never blocks (always exit 0).

- [ ] **Step 1: Write the failing test**

Save as `/tmp/test-h2.sh`:

```bash
#!/bin/sh
set -eu
hook="$(pwd)/ogsm/scripts/hooks/post-write-confirm.js"

# Non-.ogsm/ path → pass silently
out=$(echo '{"tool_input":{"file_path":"README.md"}}' | node "$hook")
if [ -n "$out" ]; then
  echo "FAIL: non-ogsm path should produce no output, got: $out"
  exit 1
fi
echo "PASS: non-ogsm path silent"

# .ogsm/profiles/ file that exists and is valid → should print validation passed
tmp_profile="$(mktemp).md"
cp ogsm/examples/sample-ogsm-profile.md "$tmp_profile"
payload="$(node -e "process.stdout.write(JSON.stringify({tool_input:{file_path:'$tmp_profile'}}))")"
out=$(echo "$payload" | node "$hook")
rm -f "$tmp_profile"
if ! echo "$out" | grep -q 'validation passed'; then
  echo "FAIL: expected 'validation passed' in output, got: $out"
  exit 1
fi
echo "PASS: profile validation message"

# .ogsm/context/ non-empty file → should print saved
tmp_ctx="$(mktemp).md"
echo "some content" > "$tmp_ctx"
payload="$(node -e "process.stdout.write(JSON.stringify({tool_input:{file_path:'$tmp_ctx'}}))")"
out=$(echo "$payload" | node "$hook" 2>&1)
rm -f "$tmp_ctx"
if ! echo "$out" | grep -q 'saved'; then
  echo "FAIL: expected 'saved' in output, got: $out"
  exit 1
fi
echo "PASS: non-profile .ogsm/ file confirmed"
```

Run:
```bash
sh /tmp/test-h2.sh
```

Expected: all three fail with wrong output (stub is silent for everything).

- [ ] **Step 2: Implement H2**

Replace `ogsm/scripts/hooks/post-write-confirm.js` with:

```javascript
#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const chunks = [];
process.stdin.on('data', (d) => chunks.push(d));
process.stdin.on('end', () => {
  let input;
  try {
    input = JSON.parse(Buffer.concat(chunks).toString());
  } catch {
    process.exit(0);
  }

  const filePath = input?.tool_input?.file_path ?? '';
  if (!filePath.includes('.ogsm/')) {
    process.exit(0);
  }

  if (filePath.includes('.ogsm/profiles/')) {
    const validateScript = path.resolve(__dirname, '..', 'validate-profile.js');
    try {
      execFileSync('node', [validateScript, filePath], { stdio: ['ignore', 'pipe', 'pipe'] });
      process.stdout.write('OGSM: profile validation passed for ' + filePath + '\n');
    } catch (err) {
      process.stderr.write('OGSM: profile validation failed after write: ' + filePath + '\n');
      process.stderr.write((err.stdout?.toString() ?? '') + '\n');
    }
  } else {
    try {
      const stat = fs.statSync(filePath);
      if (stat.size === 0) {
        process.stderr.write('OGSM: written file is empty: ' + filePath + '\n');
      } else {
        process.stdout.write('OGSM: saved ' + filePath + '\n');
      }
    } catch {
      process.stderr.write('OGSM: could not stat written file: ' + filePath + '\n');
    }
  }

  process.exit(0);
});
```

- [ ] **Step 3: Run the test to verify all three pass**

```bash
sh /tmp/test-h2.sh
```

Expected:
```
PASS: non-ogsm path silent
PASS: profile validation message
PASS: non-profile .ogsm/ file confirmed
```

- [ ] **Step 4: Commit**

```bash
git add ogsm/scripts/hooks/post-write-confirm.js
git commit -m "feat: implement H2 post-write confirmation hook"
```

---

### Task 4: Implement H3 — post-context-check.js

**Files:**
- Modify: `ogsm/scripts/hooks/post-context-check.js`

H3 runs after a Bash call containing `update-operating-context.js`. It checks the context file (argv[0] of the script call) is non-empty and has no unreplaced placeholder.

- [ ] **Step 1: Write the failing test**

Save as `/tmp/test-h3.sh`:

```bash
#!/bin/sh
set -eu
hook="$(pwd)/ogsm/scripts/hooks/post-context-check.js"

# Unrelated Bash command → silent pass
out=$(echo '{"tool_input":{"command":"ls -la"}}' | node "$hook")
if [ -n "$out" ]; then
  echo "FAIL: unrelated command should be silent, got: $out"
  exit 1
fi
echo "PASS: unrelated command silent"

# Context file updated correctly → print confirmation
tmp_ctx="$(mktemp).md"
echo "# Context\n\n## Recurring Patterns\n\n- 2026-05-06: test note\n" > "$tmp_ctx"
cmd="node ogsm/scripts/update-operating-context.js $tmp_ctx some note"
payload="$(node -e "process.stdout.write(JSON.stringify({tool_input:{command:$(node -e "process.stdout.write(JSON.stringify('$cmd'))")}}))")"
out=$(echo "$payload" | node "$hook")
rm -f "$tmp_ctx"
if ! echo "$out" | grep -q 'context updated'; then
  echo "FAIL: expected 'context updated' in output, got: $out"
  exit 1
fi
echo "PASS: updated context confirmed"

# Context file still has placeholder → stderr warning
tmp_ctx2="$(mktemp).md"
echo "# Context\n\n## Recurring Patterns\n\n- None recorded yet.\n" > "$tmp_ctx2"
cmd2="node ogsm/scripts/update-operating-context.js $tmp_ctx2 some note"
payload2="$(node -e "process.stdout.write(JSON.stringify({tool_input:{command:$(node -e "process.stdout.write(JSON.stringify('$cmd2'))")}}))")"
err=$(echo "$payload2" | node "$hook" 2>&1 >/dev/null)
rm -f "$tmp_ctx2"
if ! echo "$err" | grep -q 'placeholder'; then
  echo "FAIL: expected placeholder warning in stderr, got: $err"
  exit 1
fi
echo "PASS: placeholder warning emitted"
```

Run:
```bash
sh /tmp/test-h3.sh
```

Expected: first passes (stub is silent), next two fail.

- [ ] **Step 2: Implement H3**

Replace `ogsm/scripts/hooks/post-context-check.js` with:

```javascript
#!/usr/bin/env node
'use strict';
const fs = require('fs');

const chunks = [];
process.stdin.on('data', (d) => chunks.push(d));
process.stdin.on('end', () => {
  let input;
  try {
    input = JSON.parse(Buffer.concat(chunks).toString());
  } catch {
    process.exit(0);
  }

  const command = input?.tool_input?.command ?? '';
  if (!command.includes('update-operating-context.js')) {
    process.exit(0);
  }

  // Command form: node <script> <context-file> <note...>
  // context-file is argv[0] immediately after the script name
  const parts = command.trim().split(/\s+/);
  const scriptIdx = parts.findIndex((p) => p.includes('update-operating-context.js'));
  const contextFile = scriptIdx >= 0 ? parts[scriptIdx + 1] : null;

  if (!contextFile) {
    process.stderr.write('OGSM: could not parse context file path from command\n');
    process.exit(0);
  }

  if (!fs.existsSync(contextFile)) {
    process.stderr.write('OGSM: context file not found after update: ' + contextFile + '\n');
    process.exit(0);
  }

  const content = fs.readFileSync(contextFile, 'utf8');
  if (!content.trim()) {
    process.stderr.write('OGSM: context file is empty after update: ' + contextFile + '\n');
  } else if (content.includes('None recorded yet.')) {
    process.stderr.write('OGSM: context file still contains placeholder "None recorded yet.": ' + contextFile + '\n');
  } else {
    process.stdout.write('OGSM: context updated: ' + contextFile + '\n');
  }

  process.exit(0);
});
```

- [ ] **Step 3: Run the test to verify all three pass**

```bash
sh /tmp/test-h3.sh
```

Expected:
```
PASS: unrelated command silent
PASS: updated context confirmed
PASS: placeholder warning emitted
```

- [ ] **Step 4: Commit**

```bash
git add ogsm/scripts/hooks/post-context-check.js
git commit -m "feat: implement H3 post-context-update check hook"
```

---

### Task 5: Implement H4 — stop-reminder.js

**Files:**
- Modify: `ogsm/scripts/hooks/stop-reminder.js`

H4 prints a reminder when `.ogsm/profiles/` contains saved profile files. Always exits 0.

- [ ] **Step 1: Write the failing test**

Save as `/tmp/test-h4.sh`:

```bash
#!/bin/sh
set -eu
hook="$(pwd)/ogsm/scripts/hooks/stop-reminder.js"

# No .ogsm/profiles/ in cwd → no output
out=$(cd /tmp && node "$hook")
if [ -n "$out" ]; then
  echo "FAIL: no .ogsm should produce no output, got: $out"
  exit 1
fi
echo "PASS: no .ogsm silent"

# .ogsm/profiles/ exists with a .md file → reminder printed
tmp_root="$(mktemp -d)"
mkdir -p "$tmp_root/.ogsm/profiles/company"
echo "# profile" > "$tmp_root/.ogsm/profiles/company/test.md"
out=$(cd "$tmp_root" && node "$hook")
rm -rf "$tmp_root"
if ! echo "$out" | grep -q 'OGSM: session ending'; then
  echo "FAIL: expected reminder, got: $out"
  exit 1
fi
echo "PASS: reminder printed"

# .ogsm/profiles/ exists but contains only directories → no output
tmp_root2="$(mktemp -d)"
mkdir -p "$tmp_root2/.ogsm/profiles/company"
out=$(cd "$tmp_root2" && node "$hook")
rm -rf "$tmp_root2"
if [ -n "$out" ]; then
  echo "FAIL: empty profiles dir should be silent, got: $out"
  exit 1
fi
echo "PASS: empty profiles dir silent"
```

Run:
```bash
sh /tmp/test-h4.sh
```

Expected: first passes (stub is silent in /tmp), second fails (stub gives no output), third passes.

- [ ] **Step 2: Implement H4**

Replace `ogsm/scripts/hooks/stop-reminder.js` with:

```javascript
#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');

function hasMdFiles(dir) {
  if (!fs.existsSync(dir)) return false;
  return fs.readdirSync(dir).some((f) => f.endsWith('.md'));
}

const profilesRoot = path.join(process.cwd(), '.ogsm', 'profiles');
if (!fs.existsSync(profilesRoot)) {
  process.exit(0);
}

const companyDir = path.join(profilesRoot, 'company');
const deptsDir = path.join(profilesRoot, 'departments');

if (!hasMdFiles(companyDir) && !hasMdFiles(deptsDir)) {
  process.exit(0);
}

process.stdout.write(
  'OGSM: session ending. Confirm any unsaved profile, context, or review changes have been written to .ogsm/.\n'
);
process.exit(0);
```

- [ ] **Step 3: Run the test to verify all three pass**

```bash
sh /tmp/test-h4.sh
```

Expected:
```
PASS: no .ogsm silent
PASS: reminder printed
PASS: empty profiles dir silent
```

- [ ] **Step 4: Commit**

```bash
git add ogsm/scripts/hooks/stop-reminder.js
git commit -m "feat: implement H4 stop reminder hook"
```

---

### Task 6: Update validate-architecture.sh

**Files:**
- Modify: `ogsm/scripts/validate-architecture.sh`

Add checks that the four hook scripts exist and are executable, and that `.claude/settings.json` contains the `PreToolUse` hook config.

- [ ] **Step 1: Run validate-architecture.sh to confirm it currently passes (no hooks yet)**

```bash
ogsm/scripts/validate-architecture.sh && echo "arch check passed"
```

Expected: passes.

- [ ] **Step 2: Add hook checks at the end of validate-architecture.sh**

Append before the final line (or after the last `grep -q` block):

```sh
for hook in pre-write-validate-profile post-write-confirm post-context-check stop-reminder; do
  test -x "$plugin_root/scripts/hooks/$hook.js"
done

test -f "$plugin_root/../.claude/settings.json"
grep -q '"PreToolUse"' "$plugin_root/../.claude/settings.json"
```

- [ ] **Step 3: Run validate-architecture.sh to confirm it passes with hooks**

```bash
ogsm/scripts/validate-architecture.sh && echo "arch check passed"
```

Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add ogsm/scripts/validate-architecture.sh
git commit -m "chore: add hook file checks to validate-architecture.sh"
```

---

### Task 7: Add hook smoke tests to test-scripts.sh

**Files:**
- Modify: `ogsm/scripts/test-scripts.sh`

Add inline hook smoke tests so the single `test-scripts.sh` command covers hooks.

- [ ] **Step 1: Run test-scripts.sh to confirm it currently passes**

```bash
ogsm/scripts/test-scripts.sh && echo "test-scripts passed"
```

Expected: passes.

- [ ] **Step 2: Append hook tests at end of test-scripts.sh (before the final validate-architecture.sh call)**

Add the following block before the `"$script_dir/validate-architecture.sh"` line at the end of `test-scripts.sh`:

```sh
# H1: non-.ogsm/profiles/ path → pass silently
echo '{"tool_input":{"file_path":"README.md","content":"anything"}}' | \
  node "$script_dir/hooks/pre-write-validate-profile.js"

# H1: invalid profile → exit non-zero
if echo '{"tool_input":{"file_path":".ogsm/profiles/company/test.md","content":"# bad"}}' | \
  node "$script_dir/hooks/pre-write-validate-profile.js" 2>/dev/null; then
  echo "Expected H1 to block invalid profile" >&2
  exit 1
fi

# H1: valid profile → exit 0
valid_content="$(node -e "process.stdout.write(JSON.stringify(require('fs').readFileSync('$plugin_root/examples/sample-ogsm-profile.md','utf8')))")"
printf '{"tool_input":{"file_path":".ogsm/profiles/company/test.md","content":%s}}' "$valid_content" | \
  node "$script_dir/hooks/pre-write-validate-profile.js"

# H2: non-.ogsm/ path → silent
out=$(echo '{"tool_input":{"file_path":"README.md"}}' | node "$script_dir/hooks/post-write-confirm.js")
test -z "$out"

# H3: unrelated Bash command → silent
out=$(echo '{"tool_input":{"command":"ls -la"}}' | node "$script_dir/hooks/post-context-check.js")
test -z "$out"

# H4: no .ogsm in /tmp → silent
out=$(cd /tmp && node "$script_dir/hooks/stop-reminder.js")
test -z "$out"

# H4: .ogsm/profiles/ with a .md file → reminder printed
tmp_h4="$(mktemp -d)"
mkdir -p "$tmp_h4/.ogsm/profiles/company"
echo "# profile" > "$tmp_h4/.ogsm/profiles/company/test.md"
out=$(cd "$tmp_h4" && node "$script_dir/hooks/stop-reminder.js")
rm -rf "$tmp_h4"
echo "$out" | grep -q 'OGSM: session ending'
```

- [ ] **Step 3: Run test-scripts.sh to confirm all hook tests pass**

```bash
ogsm/scripts/test-scripts.sh && echo "all tests passed"
```

Expected: `all tests passed` with no errors.

- [ ] **Step 4: Commit**

```bash
git add ogsm/scripts/test-scripts.sh
git commit -m "test: add hook smoke tests to test-scripts.sh"
```
