# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A Codex/Claude Code plugin that operationalizes the OGSM framework (Objective → Goals → Strategies → M\[D+P\]) through a repeatable loop: define profile → translate into priorities → audit plans/schedules → realign → weekly review.

## Validation & Testing

Run all validation at once:

```bash
ogsm/scripts/test-scripts.sh
```

This runs:
1. `validate-profile.js` against the sample profile
2. `normalize-schedule.js` against the sample schedule
3. `score-alignment.js` with fixture JSON
4. `update-operating-context.js`
5. `normalize-calendar-events.js` (calendar JSON → schedule table)
6. `prepare-storage.js` (preview and write modes)
7. Hook smoke tests (H1–H4, 8 test cases)
8. `validate-architecture.sh` (structural integrity checks including hook files)

Run architecture checks independently:

```bash
ogsm/scripts/validate-architecture.sh
```

Individual script usage:

```bash
# Preview storage initialization (no write)
node ogsm/scripts/prepare-storage.js . company <company-slug>

# Create storage after confirmation
node ogsm/scripts/prepare-storage.js . company <company-slug> --confirm-write

# Validate a saved profile
node ogsm/scripts/validate-profile.js .ogsm/profiles/company/<slug>.md

# Normalize a manual schedule
node ogsm/scripts/normalize-schedule.js examples/sample-schedule-input.md

# Normalize exported calendar JSON → schedule table
node ogsm/scripts/normalize-calendar-events.js /path/to/calendar-events.json

# Score plan/schedule alignment
node ogsm/scripts/score-alignment.js /path/to/alignment-items.json

# Append an observation to operating context
node ogsm/scripts/update-operating-context.js .ogsm/context/company/<slug>.md "observation text"
```

## Architecture

### Progressive Disclosure Pattern

Each `skills/<name>/SKILL.md` is a short entrypoint (trigger conditions, inputs/outputs, short workflow, tool summary). Heavy content lives in the shared `references/` directory and is loaded only when needed.

```
skills/<skill-name>/
  SKILL.md          ← entrypoint
  references/       ← skill-specific references (mostly empty; shared ones in root references/)
  scripts/          ← skill-specific scripts (mostly empty; shared ones in root scripts/)
  assets/           ← skill-specific assets (mostly empty; shared ones in root assets/)

references/         ← shared rules, rubrics, schemas, anti-patterns
assets/             ← shared templates and output skeletons
scripts/            ← shared validation, normalization, scoring, context-update scripts
examples/           ← sample inputs, outputs, and storage layout
```

### Skill Execution Order (OGSM Loop)

```
ogsm-define → ogsm-translate → ogsm-audit-plan / ogsm-audit-schedule → ogsm-realign → ogsm-weekly-review
                                       ↑
                              ogsm-calendar-brief (optional pre-step for schedule audit)
```

`ogsm-calendar-brief` is the only skill that may read Google Calendar. All others must not use it.

### Storage Layout

Persistent data lives under `.ogsm/` at the project root (never written without explicit user confirmation):

```
.ogsm/
  index.md
  profiles/
    company/<company-slug>.md
    departments/<department-slug>.md
  context/
    company/<company-slug>.md
    departments/<department-slug>.md
  reviews/
    company/<company-slug>/<YYYY-MM-DD>-<review-type>.md
    departments/<department-slug>/<YYYY-MM-DD>-<review-type>.md
  archive/
    company/
    departments/
```

### Plugin Manifests

- `plugin.toml` — legacy MVP manifest (skill list with paths)
- `.codex-plugin/plugin.json` — Codex marketplace manifest
- `.claude-plugin/plugin.json` — Claude Code marketplace manifest

## Claude Code Hooks

Four shell hooks enforce `.ogsm/` storage safety in Claude Code. Codex is unaffected — it continues to rely on SKILL.md text instructions only.

| Hook | Type | Trigger | Script | Behaviour |
|------|------|---------|--------|-----------|
| H1 | PreToolUse Write | `file_path` contains `.ogsm/profiles/` | `scripts/hooks/pre-write-validate-profile.js` | Runs `validate-profile.js` on content; exits 2 to block invalid writes |
| H2 | PostToolUse Write | `file_path` contains `.ogsm/` | `scripts/hooks/post-write-confirm.js` | Re-validates profiles after write; confirms other files non-empty |
| H3 | PostToolUse Bash | `command` contains `update-operating-context.js` | `scripts/hooks/post-context-check.js` | Checks context file for empty content or unreplaced placeholder |
| H4 | Stop | Always | `scripts/hooks/stop-reminder.js` | Prints reminder if `.ogsm/profiles/` has `.md` files |

Hooks are wired in `.claude/settings.json` at the repository root (one level above `ogsm/`). H1 is the only blocking hook (exit 2); H2/H3/H4 always exit 0.

## Safety Constraints

**Never do without explicit user confirmation:**
- Write any `.ogsm/` file (profile, context, review)
- Change Objective, Goals, Strategies, MD, or MP
- Write to GitHub, Linear, calendars, or external documents

**Before any write, always show:**
1. Target path
2. Content summary or diff (before/after excerpt)
3. Backward linkage impact: `MP → MD → S → G → O`
4. Recorded date

**Connector rule:** Only `ogsm-calendar-brief` may invoke the Google Calendar connector. If unavailable, fall back to manual agenda input.

## Key References

| File | Purpose |
|------|---------|
| `references/ogsm-principles.md` | Canonical OGSM definitions and anti-patterns |
| `references/ogsm-profile-format.md` | Required/recommended profile sections and quality rules |
| `references/storage-policy.md` | Path conventions, metadata format, parent-alignment rules |
| `references/tool-policy.md` | Allowed/restricted tools and fallback rules |
| `references/progressive-disclosure.md` | Cross-skill handoff rules |
| `references/adaptive-operating-context.md` | What operating context tracks and how it may influence reviews |
| `references/review-rubric.md` | Scoring rubric for plan/schedule audits |

## Adding a New Skill

1. Create `skills/<skill-name>/SKILL.md` with required frontmatter (`name:`, `description:`), and sections `## Workflow`, `## Progressive Disclosure`, `## Tools`.
2. Create the three required subdirectories: `references/`, `scripts/`, `assets/` (add `.gitkeep` if empty).
3. Register the skill in `plugin.toml` with `name` and `path`.
4. Run `ogsm/scripts/validate-architecture.sh` to verify structural integrity.
