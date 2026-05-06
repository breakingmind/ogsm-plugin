# OGSM Hook Integration Design

Date: 2026-05-06

## Problem

The OGSM plugin runs on two runtimes: Claude Code and Codex. Codex has no shell hook system and relies entirely on SKILL.md instructions. Claude Code supports PreToolUse/PostToolUse/Stop hooks in `settings.json`. The goal is to add mechanical enforcement for Claude Code without changing the behavior Codex sees.

## Approach

SKILL.md remains the single source of truth for both runtimes. Claude Code hooks add a second enforcement layer on top — the same rules, enforced mechanically at the shell level.

**Codex:** SKILL.md instructions only.
**Claude Code:** SKILL.md instructions + shell hooks.

## Hook Inventory

| # | Type | Trigger | Script | Action |
|---|------|---------|--------|--------|
| H1 | PreToolUse Write | `file_path` matches `.ogsm/profiles/**` | `hooks/pre-write-validate-profile.js` | Validate content via `validate-profile.js` before write; exit 1 blocks write |
| H2 | PostToolUse Write | `file_path` matches `.ogsm/**` | `hooks/post-write-confirm.js` | Re-validate profiles after write; confirm non-empty for other `.ogsm/` files |
| H3 | PostToolUse Bash | `command` contains `update-operating-context.js` | `hooks/post-context-check.js` | Parse context path from command; warn if file empty or placeholder unreplaced |
| H4 | Stop | Always | `hooks/stop-reminder.js` | If `.ogsm/profiles/` contains `.md` files, print unsaved-changes reminder |

Non-matching inputs in all scripts: exit 0 immediately (pass-through).

## File Locations

Hook scripts live alongside existing plugin scripts:

```
ogsm/scripts/hooks/
  pre-write-validate-profile.js
  post-write-confirm.js
  post-context-check.js
  stop-reminder.js
```

Hook configuration lives in the project-level Claude Code settings:

```
.claude/settings.json
```

## settings.json Structure

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

## Script Logic

### H1 `pre-write-validate-profile.js`

```
stdin → { tool_name, tool_input: { file_path, content } }

if file_path does not match .ogsm/profiles/** → exit 0
write content to tmpfile
run validate-profile.js tmpfile
if fail → stderr error message, exit 1 (blocks write)
delete tmpfile, exit 0
```

### H2 `post-write-confirm.js`

```
stdin → { tool_name, tool_input: { file_path }, tool_response }

if file_path does not match .ogsm/** → exit 0
if file_path matches .ogsm/profiles/** → run validate-profile.js file_path, print result
else → confirm file exists and is non-empty, print "✓ saved: file_path"
exit 0 (PostToolUse never blocks)
```

### H3 `post-context-check.js`

```
stdin → { tool_name, tool_input: { command } }

if command does not contain update-operating-context.js → exit 0
parse context file path from command (argv[0] of the script, i.e. the first argument after the script name)
if file missing or empty → stderr warning
if file still contains "None recorded yet." → stderr warning (placeholder unreplaced)
exit 0
```

### H4 `stop-reminder.js`

```
if .ogsm/profiles/ does not exist or contains no .md files → exit 0
print:
  "OGSM: session ending. Confirm any unsaved profile, context, or review changes have been written to .ogsm/."
exit 0
```

## Validation

### test-scripts.sh additions

```bash
# H1: valid profile content → should pass
node ogsm/scripts/hooks/pre-write-validate-profile.js <<JSON
{"tool_name":"Write","tool_input":{"file_path":".ogsm/profiles/company/test.md","content":"<sample profile>"}}
JSON

# H1: non-.ogsm/profiles/ path → should pass without validation
node ogsm/scripts/hooks/pre-write-validate-profile.js <<JSON
{"tool_name":"Write","tool_input":{"file_path":"README.md","content":"anything"}}
JSON

# H4: no .ogsm/profiles/ → should produce no output
(cd /tmp && node "$OLDPWD/ogsm/scripts/hooks/stop-reminder.js")
```

### validate-architecture.sh additions

```bash
for hook in pre-write-validate-profile post-write-confirm post-context-check stop-reminder; do
  test -x "$plugin_root/scripts/hooks/$hook.js"
done

grep -q '"PreToolUse"' "$plugin_root/../.claude/settings.json"
```

## Constraints

- PostToolUse hooks always exit 0 — they warn but never block.
- PreToolUse H1 exits 1 only for `.ogsm/profiles/**` writes that fail validation.
- No hook modifies OGSM fields, profiles, or context directly.
- Hook scripts have no external dependencies beyond Node.js built-ins.
- SKILL.md is not modified — it continues to be the authoritative execution spec for both runtimes.
