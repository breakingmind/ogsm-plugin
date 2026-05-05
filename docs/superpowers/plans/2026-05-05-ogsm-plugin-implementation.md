# OGSM Plugin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an MVP Codex plugin that helps users define, translate, audit, realign, and review OGSM through progressive-disclosure skills.

**Architecture:** Create a documentation-first Codex plugin under `ogsm/`, with short `SKILL.md` entrypoints, shared references, reusable scripts, assets, and examples. Mechanical validation and normalization live in scripts; long rules live in references; templates live in assets.

**Tech Stack:** Codex plugin metadata, Markdown skills/references/assets, POSIX shell scripts, Node.js scripts using only built-in modules, git.

---

## File Structure

- Create `ogsm/plugin.toml`: plugin metadata and skill declarations.
- Create `ogsm/README.md`: user-facing overview and workflow.
- Create `ogsm/references/ogsm-principles.md`: OGSM rules and anti-patterns.
- Create `ogsm/references/ogsm-profile-format.md`: canonical profile schema.
- Create `ogsm/references/review-rubric.md`: shared scoring rubric.
- Create `ogsm/references/schedule-normalization.md`: event normalization schema.
- Create `ogsm/references/output-formats.md`: quick/full/realign output formats.
- Create `ogsm/references/adaptive-operating-context.md`: adaptive context rules.
- Create `ogsm/references/tool-policy.md`: shared tool permissions and fallbacks.
- Create `ogsm/references/progressive-disclosure.md`: skill architecture rules.
- Create `ogsm/assets/profile-template.md`: reusable OGSM profile template.
- Create `ogsm/assets/operating-context-template.md`: adaptive context template.
- Create `ogsm/assets/quick-review-template.md`: quick review output skeleton.
- Create `ogsm/assets/full-audit-template.md`: full audit output skeleton.
- Create `ogsm/assets/realign-template.md`: realign output skeleton.
- Create `ogsm/scripts/validate-profile.js`: validates required OGSM profile sections.
- Create `ogsm/scripts/normalize-schedule.js`: converts rough schedule text into a normalized Markdown table.
- Create `ogsm/scripts/score-alignment.js`: scores alignment records from JSON input.
- Create `ogsm/scripts/update-operating-context.js`: appends reviewed learning notes to adaptive context.
- Create `ogsm/scripts/test-scripts.sh`: runs all script smoke tests.
- Create `ogsm/examples/sample-ogsm-profile.md`: valid sample profile.
- Create `ogsm/examples/sample-plan-input.md`: sample plan for audit.
- Create `ogsm/examples/sample-schedule-input.md`: sample schedule dump.
- Create `ogsm/examples/sample-quick-review.md`: expected quick review shape.
- Create `ogsm/examples/sample-full-audit.md`: expected full audit shape.
- Create `ogsm/examples/sample-realign-output.md`: expected realign shape.
- Create one `SKILL.md` for each skill:
  - `ogsm/skills/ogsm-define/SKILL.md`
  - `ogsm/skills/ogsm-translate/SKILL.md`
  - `ogsm/skills/ogsm-audit-plan/SKILL.md`
  - `ogsm/skills/ogsm-audit-schedule/SKILL.md`
  - `ogsm/skills/ogsm-calendar-brief/SKILL.md`
  - `ogsm/skills/ogsm-realign/SKILL.md`
  - `ogsm/skills/ogsm-weekly-review/SKILL.md`
- Create empty `.gitkeep` files under each skill's `references/`, `scripts/`, and `assets/` directory so the progressive-disclosure structure exists from the first commit.

## Task 1: Plugin Skeleton

**Files:**
- Create: `ogsm/plugin.toml`
- Create: `ogsm/README.md`
- Create: `ogsm/skills/*/{references,scripts,assets}/.gitkeep`

- [ ] **Step 1: Create plugin directories**

Run:

```bash
mkdir -p ogsm/skills/ogsm-define/references ogsm/skills/ogsm-define/scripts ogsm/skills/ogsm-define/assets
mkdir -p ogsm/skills/ogsm-translate/references ogsm/skills/ogsm-translate/scripts ogsm/skills/ogsm-translate/assets
mkdir -p ogsm/skills/ogsm-audit-plan/references ogsm/skills/ogsm-audit-plan/scripts ogsm/skills/ogsm-audit-plan/assets
mkdir -p ogsm/skills/ogsm-audit-schedule/references ogsm/skills/ogsm-audit-schedule/scripts ogsm/skills/ogsm-audit-schedule/assets
mkdir -p ogsm/skills/ogsm-calendar-brief/references ogsm/skills/ogsm-calendar-brief/scripts ogsm/skills/ogsm-calendar-brief/assets
mkdir -p ogsm/skills/ogsm-realign/references ogsm/skills/ogsm-realign/scripts ogsm/skills/ogsm-realign/assets
mkdir -p ogsm/skills/ogsm-weekly-review/references ogsm/skills/ogsm-weekly-review/scripts ogsm/skills/ogsm-weekly-review/assets
mkdir -p ogsm/references ogsm/scripts ogsm/assets ogsm/examples
```

Expected: directories exist under `ogsm/`.

- [ ] **Step 2: Add `.gitkeep` files**

Run:

```bash
touch ogsm/skills/ogsm-define/references/.gitkeep ogsm/skills/ogsm-define/scripts/.gitkeep ogsm/skills/ogsm-define/assets/.gitkeep
touch ogsm/skills/ogsm-translate/references/.gitkeep ogsm/skills/ogsm-translate/scripts/.gitkeep ogsm/skills/ogsm-translate/assets/.gitkeep
touch ogsm/skills/ogsm-audit-plan/references/.gitkeep ogsm/skills/ogsm-audit-plan/scripts/.gitkeep ogsm/skills/ogsm-audit-plan/assets/.gitkeep
touch ogsm/skills/ogsm-audit-schedule/references/.gitkeep ogsm/skills/ogsm-audit-schedule/scripts/.gitkeep ogsm/skills/ogsm-audit-schedule/assets/.gitkeep
touch ogsm/skills/ogsm-calendar-brief/references/.gitkeep ogsm/skills/ogsm-calendar-brief/scripts/.gitkeep ogsm/skills/ogsm-calendar-brief/assets/.gitkeep
touch ogsm/skills/ogsm-realign/references/.gitkeep ogsm/skills/ogsm-realign/scripts/.gitkeep ogsm/skills/ogsm-realign/assets/.gitkeep
touch ogsm/skills/ogsm-weekly-review/references/.gitkeep ogsm/skills/ogsm-weekly-review/scripts/.gitkeep ogsm/skills/ogsm-weekly-review/assets/.gitkeep
```

Expected: `git status --short` shows new `ogsm/` files after later content files are added.

- [ ] **Step 3: Create `plugin.toml`**

Write `ogsm/plugin.toml` exactly:

```toml
[plugin]
name = "ogsm"
version = "0.1.0"
description = "Adaptive OGSM operating loop skills for defining, auditing, realigning, and reviewing plans and schedules."
author = "breakingmind"

[[skills]]
name = "ogsm-define"
path = "skills/ogsm-define/SKILL.md"

[[skills]]
name = "ogsm-translate"
path = "skills/ogsm-translate/SKILL.md"

[[skills]]
name = "ogsm-audit-plan"
path = "skills/ogsm-audit-plan/SKILL.md"

[[skills]]
name = "ogsm-audit-schedule"
path = "skills/ogsm-audit-schedule/SKILL.md"

[[skills]]
name = "ogsm-calendar-brief"
path = "skills/ogsm-calendar-brief/SKILL.md"

[[skills]]
name = "ogsm-realign"
path = "skills/ogsm-realign/SKILL.md"

[[skills]]
name = "ogsm-weekly-review"
path = "skills/ogsm-weekly-review/SKILL.md"
```

- [ ] **Step 4: Create `README.md`**

Write `ogsm/README.md` exactly:

```markdown
# OGSM Plugin

This plugin helps users make OGSM operational through a repeatable loop:

1. Define an OGSM profile.
2. Translate it into priorities and time allocation guidance.
3. Audit plans and schedules.
4. Realign work into a more executable version.
5. Review weekly execution and update adaptive context.

The plugin uses progressive disclosure. Skill entrypoints stay short; long rules live in `references/`, templates live in `assets/`, and repeatable mechanical work lives in `scripts/`.

The MVP never modifies calendars, external documents, Objective, Goals, Strategies, MD, or MP without explicit user confirmation.
```

- [ ] **Step 5: Verify skeleton**

Run:

```bash
test -f ogsm/plugin.toml
test -f ogsm/README.md
test -d ogsm/references
test -d ogsm/scripts
test -d ogsm/assets
test -d ogsm/examples
test -d ogsm/skills/ogsm-define/references
```

Expected: command exits with status `0`.

- [ ] **Step 6: Commit**

Run:

```bash
git add ogsm/plugin.toml ogsm/README.md ogsm/skills
git commit -m "feat: add OGSM plugin skeleton"
```

Expected: commit succeeds.

## Task 2: Shared References

**Files:**
- Create: `ogsm/references/ogsm-principles.md`
- Create: `ogsm/references/ogsm-profile-format.md`
- Create: `ogsm/references/review-rubric.md`
- Create: `ogsm/references/schedule-normalization.md`
- Create: `ogsm/references/output-formats.md`
- Create: `ogsm/references/adaptive-operating-context.md`
- Create: `ogsm/references/tool-policy.md`
- Create: `ogsm/references/progressive-disclosure.md`

- [ ] **Step 1: Create `ogsm-principles.md`**

Write `ogsm/references/ogsm-principles.md`:

```markdown
# OGSM Principles

OGSM connects ambition to execution:

- Objective names the target audience, service scope, value, positioning, and vivid picture of success.
- Goals define concrete outcomes from Objective keywords, with verb, noun, baseline, total target, and date range.
- Strategies define the resources, methodology, and tools selected to reach the Goals.
- M is the execution check system: MD measures whether the Strategy is working, and MP lists time-ordered action plans.

The core logic check works backward: MP completion should achieve MD; MD achievement should prove Strategy effectiveness; Strategy achievement should reach Goals; Goals should support the Objective.

Strong OGSMs are selective. They make it easier to say no.

## Anti-Patterns

- Objective is a slogan without a tradeoff.
- Goals describe effort instead of outcomes.
- Strategies are task lists instead of resources, methodology, or tools.
- Strategies do not identify resources that are new, unique, or consumed.
- MD items are vanity metrics or lack date, target, baseline, or review cadence.
- MP items lack owner, collaborating unit, time order, or concrete work content.
- MP cannot be traced backward to MD, Strategy, Goal, and Objective.
- Calendar time does not support the declared Strategies.
- Every urgent request is treated as strategy work.
```

- [ ] **Step 2: Create `ogsm-profile-format.md`**

Write `ogsm/references/ogsm-profile-format.md`:

```markdown
# OGSM Profile Format

The canonical profile is Markdown.

## Required Sections

- Profile Name
- Time Horizon
- Objective
- Goals
- Strategies
- MD
- MP
- Review Cadence

## Recommended Sections

- Current Focus Period
- Strategy Priority Weights
- Preferred Working Rhythm
- Known Constraints
- Decision Rules
- Last Reviewed Date

## Quality Rules

- Objective must name target audience, service scope, value, positioning, and a vivid picture of success.
- Goals must connect to Objective keywords and include verb, noun, baseline, total target, and date range where possible.
- Strategies must describe selected resources, methodology, and tools, not all possible work.
- MD must include indicator, date, target or total amount, and the Strategy it validates.
- MP must include owner or unit, collaborating unit when relevant, time order, date or period, and work content.
- Each MP should connect to an MD; each MD should validate a Strategy; each Strategy should support a Goal.
```

- [ ] **Step 3: Create `review-rubric.md`**

Write `ogsm/references/review-rubric.md`:

```markdown
# Review Rubric

Score each dimension from 1 to 5.

1 means weak, unclear, or missing.
3 means usable but needs correction.
5 means clear, focused, and operational.

## Dimensions

- Objective clarity
- Goal measurability
- Strategy as resource/method quality
- MD quality
- MP executability
- MP-to-MD linkage
- MD-to-Strategy linkage
- Strategy-to-Goal linkage
- Goal-to-Objective linkage
- Backward logic: MP to MD to S to G to O
- Plan alignment
- Schedule alignment
- Time allocation realism
- Execution risk

Every score below 4 needs a reason and a concrete correction.

## Confidence

Use high confidence only when the OGSM profile and input are both clear.
Use medium confidence when assumptions are minor.
Use low confidence when profile, plan, or schedule data is incomplete.
```

- [ ] **Step 4: Create `schedule-normalization.md`**

Write `ogsm/references/schedule-normalization.md`:

```markdown
# Schedule Normalization

Normalize every schedule input into a Markdown table.

| Date | Start | End | Duration | Title | Type | Mobility | Strategy Link | MD Link | MP Link | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

## Event Types

- Deep work
- Meeting
- Admin
- Sales
- Product
- Delivery
- Learning
- Personal
- Unknown

## Mobility

- Fixed
- Movable
- Optional
- Delegable
- Unknown

If input is ambiguous, create the table first, list assumptions, and ask the user to confirm before scoring.
```

- [ ] **Step 5: Create `output-formats.md`**

Write `ogsm/references/output-formats.md`:

```markdown
# Output Formats

## Quick Review

- Alignment score
- Confidence
- Top 3 risks
- Top 3 recommended changes
- One next action

## Full Audit

- Executive summary
- Alignment matrix
- Strengths
- Gaps
- MD quality review
- MP executability review
- Backward logic review
- Time allocation analysis when schedule input exists
- Risks and tradeoffs
- Recommended corrections
- Open questions

## Realign

- Revised plan or schedule
- Change log
- MP, MD, Strategy, Goal, and Objective linkage
- Delete, defer, delegate, shorten, move, or add decisions
- Suggested next review point
```

- [ ] **Step 6: Create `adaptive-operating-context.md`**

Write `ogsm/references/adaptive-operating-context.md`:

```markdown
# Adaptive Operating Context

The operating context records how the user actually works.

It may track:

- Accepted recommendations
- Rejected recommendations
- Preferred output style
- Preferred review depth
- Deep work windows
- Meeting load tolerance
- Recurring schedule conflicts
- Under-supported Strategies
- Weak or untracked MD
- MP missing owner, collaborator, date, or work content
- User decision rules

The context can influence future reviews, but it must not silently change the OGSM profile.

Any Objective, Goal, Strategy, MD, or MP change requires:

1. Proposed change
2. Reason
3. User confirmation
4. Recorded date
```

- [ ] **Step 7: Create `tool-policy.md`**

Write `ogsm/references/tool-policy.md`:

```markdown
# Tool Policy

## Allowed Tools

- Read local plugin files, references, assets, examples, profiles, and operating context.
- Write local profile, operating context, and review outputs after user confirmation.
- Execute plugin scripts for validation, normalization, scoring, and context updates.
- Use Google Calendar connector only from `ogsm-calendar-brief`.

## Restricted Tools

- Do not modify calendar events in MVP.
- Do not modify external documents in MVP.
- Do not update Objective, Goals, Strategies, MD, or MP without explicit confirmation.
- Do not treat connector failure as workflow failure.

## Fallbacks

- If Google Calendar is unavailable, ask for manual agenda input.
- If scripts are unavailable, perform the workflow manually and state the fallback.
- If profile data is incomplete, ask for the smallest missing field before scoring.
```

- [ ] **Step 8: Create `progressive-disclosure.md`**

Write `ogsm/references/progressive-disclosure.md`:

```markdown
# Progressive Disclosure

Each `SKILL.md` is an entrypoint, not a full manual.

Keep in `SKILL.md`:

- Trigger conditions
- Inputs and outputs
- Short workflow
- Tool policy summary
- References to load only when needed

Move to `references/`:

- Rubrics
- Long rules
- Anti-patterns
- Schemas

Move to `assets/`:

- Templates
- Output skeletons
- Reusable Markdown snippets

Move to `scripts/`:

- Validation
- Normalization
- Scoring
- Context updates
```

- [ ] **Step 9: Verify references**

Run:

```bash
test -f ogsm/references/ogsm-principles.md
test -f ogsm/references/ogsm-profile-format.md
test -f ogsm/references/review-rubric.md
test -f ogsm/references/schedule-normalization.md
test -f ogsm/references/output-formats.md
test -f ogsm/references/adaptive-operating-context.md
test -f ogsm/references/tool-policy.md
test -f ogsm/references/progressive-disclosure.md
```

Expected: command exits with status `0`.

- [ ] **Step 10: Commit**

Run:

```bash
git add ogsm/references
git commit -m "feat: add OGSM shared references"
```

Expected: commit succeeds.

## Task 3: Assets and Examples

**Files:**
- Create: `ogsm/assets/profile-template.md`
- Create: `ogsm/assets/operating-context-template.md`
- Create: `ogsm/assets/quick-review-template.md`
- Create: `ogsm/assets/full-audit-template.md`
- Create: `ogsm/assets/realign-template.md`
- Create: `ogsm/examples/sample-ogsm-profile.md`
- Create: `ogsm/examples/sample-plan-input.md`
- Create: `ogsm/examples/sample-schedule-input.md`
- Create: `ogsm/examples/sample-quick-review.md`
- Create: `ogsm/examples/sample-full-audit.md`
- Create: `ogsm/examples/sample-realign-output.md`

- [ ] **Step 1: Create profile template**

Write `ogsm/assets/profile-template.md`:

```markdown
# OGSM Profile: Example

## Profile Name

Example OGSM

## Time Horizon

2026 Q2

## Objective

Provide internal teams with a focused operating rhythm that turns strategy into visible weekly execution, becoming a reliable strategy-to-action management partner.

## Goals

1. Ship one validated MVP workflow by 2026-06-30.
2. Reduce low-alignment meeting time by 25% by 2026-06-30.

## Strategies

1. Through protected deep work time and weekly review rituals, complete the validated MVP workflow.
2. Through calendar load visibility and decision rules, reduce low-alignment meeting time.
3. Through a lightweight dashboard and owner cadence, inspect MD progress every week.

## MD

1. 2026-06-30: MVP workflow completion reaches 100% from 0% baseline, reviewed weekly.
2. 2026-06-30: low-alignment meeting hours reduce by 25% from user-confirmed baseline, reviewed weekly.

## MP

1. Product owner, with engineering support, completes dashboard prototype deep work every Monday 10:30-12:00 through 2026-06-30.
2. Strategy owner reviews metric baseline every Wednesday 09:00-09:30 through 2026-06-30.
3. Calendar owner reviews and moves low-alignment exploratory calls every Friday before weekly OGSM review.

## Review Cadence

Weekly on Friday.

## Decision Rules

- Say no to work that does not support a Strategy or required obligation.
- Add an MD check-in and MP owner before adding new strategy work.
```

- [ ] **Step 2: Create operating context template**

Write `ogsm/assets/operating-context-template.md`:

```markdown
# OGSM Operating Context

## Preferences

- Preferred output style: mixed scoring and coaching
- Preferred review depth: quick review first, full audit on request

## Working Rhythm

- Deep work windows: not yet confirmed
- Meeting load tolerance: not yet confirmed

## Accepted Recommendations

- None recorded yet.

## Rejected Recommendations

- None recorded yet.

## Recurring Patterns

- None recorded yet.

## Last Updated

Not yet reviewed.
```

- [ ] **Step 3: Create output templates**

Write `ogsm/assets/quick-review-template.md`:

```markdown
# Quick OGSM Review

## Alignment Score

Score: 0/100
Confidence: low

## Top Risks

1. Risk
2. Risk
3. Risk

## Recommended Changes

1. Change
2. Change
3. Change

## Next Action

Action
```

Write `ogsm/assets/full-audit-template.md`:

```markdown
# Full OGSM Audit

## Executive Summary

Summary

## Alignment Matrix

| Item | Strategy Link | MD Link | MP Link | Score | Correction |
| --- | --- | --- | --- | --- | --- |

## Strengths

- Strength

## Gaps

- Gap

## MD Quality

- MD finding

## MP Executability

- MP finding

## Time Allocation

- Time finding

## Risks and Tradeoffs

- Risk

## Recommended Corrections

- Correction

## Open Questions

- Question
```

Write `ogsm/assets/realign-template.md`:

```markdown
# OGSM Realign

## Revised Version

Revised plan or schedule

## Change Log

| Change | Reason | MP/MD/S/G/O Link |
| --- | --- | --- |

## Decisions

- Delete:
- Defer:
- Delegate:
- Shorten:
- Move:
- Add:

## Next Review

Suggested review point
```

- [ ] **Step 4: Create examples**

Write `ogsm/examples/sample-ogsm-profile.md` by copying `ogsm/assets/profile-template.md`.

Write `ogsm/examples/sample-plan-input.md`:

```markdown
# Sample Plan Input

- Build onboarding guide.
- Attend weekly partner sync.
- Create dashboard prototype.
- Review metric baseline every Friday.
- Accept three new exploratory projects.
```

Write `ogsm/examples/sample-schedule-input.md`:

```markdown
Monday 09:00-10:00 Team sync
Monday 10:30-12:00 Dashboard prototype deep work
Tuesday 13:00-14:00 Partner sync
Wednesday 09:00-09:30 Metric baseline review
Thursday 15:00-17:00 Exploratory project calls
Friday 10:00-11:00 Weekly OGSM review
```

Write `ogsm/examples/sample-quick-review.md`:

```markdown
# Quick OGSM Review

## Alignment Score

Score: 72/100
Confidence: medium

## Top Risks

1. Exploratory project calls may dilute the main Strategy.
2. Low-alignment meetings are not capped.
3. MD baseline review exists but lacks an explicit MP owner note.

## Recommended Changes

1. Limit exploratory calls to one block.
2. Protect dashboard prototype deep work.
3. Add explicit MP owner for baseline review.

## Next Action

Move one exploratory project call out of this week.
```

Write `ogsm/examples/sample-full-audit.md`:

```markdown
# Full OGSM Audit

## Executive Summary

The week supports the MVP workflow but risks diluting focus through exploratory projects.

## Alignment Matrix

| Item | Strategy Link | MD Link | MP Link | Score | Correction |
| --- | --- | --- | --- | --- | --- |
| Dashboard prototype | Strategy 1 | MD 1 | MP 1 | 5 | Keep |
| Exploratory calls | Unclear | None | None | 2 | Defer or reduce |

## Strengths

- Metric review is scheduled.
- Deep work exists for core prototype.

## Gaps

- Exploratory projects lack Strategy linkage.

## MD Quality

- MVP completion is trackable.
- Meeting reduction needs a current baseline.

## MP Executability

- Dashboard prototype has a time block.
- Exploratory calls lack MP owner and Strategy linkage.

## Time Allocation

- Strategy work exists but can be displaced by calls.

## Risks and Tradeoffs

- Saying yes to exploratory work may slow MVP completion.

## Recommended Corrections

- Cap exploratory work to one block this week.

## Open Questions

- What is the current weekly low-alignment meeting baseline?
```

Write `ogsm/examples/sample-realign-output.md`:

```markdown
# OGSM Realign

## Revised Version

- Keep dashboard prototype deep work.
- Keep Friday OGSM review.
- Move two exploratory calls to next week.
- Add 30 minutes to capture meeting baseline.

## Change Log

| Change | Reason | MP/MD/S/G/O Link |
| --- | --- | --- |
| Moved exploratory calls | Reduce dilution | Strategy 1 |
| Added baseline capture | Improve MD quality and MP completeness | MD 2 / MP 3 |

## Decisions

- Delete: none
- Defer: two exploratory calls
- Delegate: none
- Shorten: partner sync if agenda is unclear
- Move: exploratory calls
- Add: meeting baseline capture

## Next Review

Review on Friday after the OGSM weekly review.
```

- [ ] **Step 5: Verify examples and assets**

Run:

```bash
test -f ogsm/assets/profile-template.md
test -f ogsm/assets/operating-context-template.md
test -f ogsm/assets/quick-review-template.md
test -f ogsm/assets/full-audit-template.md
test -f ogsm/assets/realign-template.md
test -f ogsm/examples/sample-ogsm-profile.md
test -f ogsm/examples/sample-plan-input.md
test -f ogsm/examples/sample-schedule-input.md
test -f ogsm/examples/sample-quick-review.md
test -f ogsm/examples/sample-full-audit.md
test -f ogsm/examples/sample-realign-output.md
```

Expected: command exits with status `0`.

- [ ] **Step 6: Commit**

Run:

```bash
git add ogsm/assets ogsm/examples
git commit -m "feat: add OGSM templates and examples"
```

Expected: commit succeeds.

## Task 4: Utility Scripts

**Files:**
- Create: `ogsm/scripts/validate-profile.js`
- Create: `ogsm/scripts/normalize-schedule.js`
- Create: `ogsm/scripts/score-alignment.js`
- Create: `ogsm/scripts/update-operating-context.js`
- Create: `ogsm/scripts/test-scripts.sh`

- [ ] **Step 1: Create profile validator**

Write `ogsm/scripts/validate-profile.js`:

```javascript
#!/usr/bin/env node
const fs = require('fs');

const file = process.argv[2];
if (!file) {
  console.error('Usage: validate-profile.js <profile.md>');
  process.exit(2);
}

const text = fs.readFileSync(file, 'utf8');
const required = [
  'Profile Name',
  'Time Horizon',
  'Objective',
  'Goals',
  'Strategies',
  'MD',
  'MP',
  'Review Cadence',
];

const missing = required.filter((name) => {
  const pattern = new RegExp(`^#{2,3}\\s+${name}\\s*$`, 'im');
  return !pattern.test(text);
});

if (missing.length > 0) {
  console.log(JSON.stringify({ valid: false, missing }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ valid: true, missing: [] }, null, 2));
```

- [ ] **Step 2: Create schedule normalizer**

Write `ogsm/scripts/normalize-schedule.js`:

```javascript
#!/usr/bin/env node
const fs = require('fs');

const file = process.argv[2];
if (!file) {
  console.error('Usage: normalize-schedule.js <schedule.txt>');
  process.exit(2);
}

const text = fs.readFileSync(file, 'utf8');
const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

function classify(title) {
  const lower = title.toLowerCase();
  if (lower.includes('review')) return 'Admin';
  if (lower.includes('sync') || lower.includes('call') || lower.includes('meeting')) return 'Meeting';
  if (lower.includes('deep work') || lower.includes('prototype')) return 'Deep work';
  return 'Unknown';
}

function parseLine(line) {
  const match = line.match(/^(\w+)\s+(\d{1,2}:\d{2})-(\d{1,2}:\d{2})\s+(.+)$/);
  if (!match) {
    return {
      date: 'Unknown',
      start: 'Unknown',
      end: 'Unknown',
      duration: 'Unknown',
      title: line,
      type: classify(line),
      mobility: 'Unknown',
      strategy: 'Unmapped',
      md: 'Unmapped',
      mp: 'Unmapped',
      notes: 'Could not parse date or time',
    };
  }

  const [, date, start, end, title] = match;
  return {
    date,
    start,
    end,
    duration: 'Unknown',
    title,
    type: classify(title),
    mobility: 'Unknown',
    strategy: 'Unmapped',
    md: 'Unmapped',
    mp: 'Unmapped',
    notes: '',
  };
}

const rows = lines.map(parseLine);
console.log('| Date | Start | End | Duration | Title | Type | Mobility | Strategy Link | MD Link | MP Link | Notes |');
console.log('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
for (const row of rows) {
  console.log(`| ${row.date} | ${row.start} | ${row.end} | ${row.duration} | ${row.title} | ${row.type} | ${row.mobility} | ${row.strategy} | ${row.md} | ${row.mp} | ${row.notes} |`);
}
```

- [ ] **Step 3: Create alignment scorer**

Write `ogsm/scripts/score-alignment.js`:

```javascript
#!/usr/bin/env node
const fs = require('fs');

const file = process.argv[2];
if (!file) {
  console.error('Usage: score-alignment.js <items.json>');
  process.exit(2);
}

const items = JSON.parse(fs.readFileSync(file, 'utf8'));
if (!Array.isArray(items)) {
  console.error('Input must be a JSON array');
  process.exit(2);
}

const scores = items.map((item) => {
  const strategy = item.strategyLink && item.strategyLink !== 'Unmapped';
  const md = item.mdLink && item.mdLink !== 'Unmapped';
  const mp = item.mpLink && item.mpLink !== 'Unmapped';
  const score = strategy && md && mp ? 5 : strategy && (md || mp) ? 3 : 1;
  return {
    item: item.title || item.name || 'Untitled',
    strategyLink: item.strategyLink || 'Unmapped',
    mdLink: item.mdLink || 'Unmapped',
    mpLink: item.mpLink || 'Unmapped',
    score,
  };
});

const average = scores.length === 0
  ? 0
  : scores.reduce((sum, item) => sum + item.score, 0) / scores.length;

console.log(JSON.stringify({
  averageScore: Number(average.toFixed(2)),
  items: scores,
}, null, 2));
```

- [ ] **Step 4: Create operating context updater**

Write `ogsm/scripts/update-operating-context.js`:

```javascript
#!/usr/bin/env node
const fs = require('fs');

const file = process.argv[2];
const note = process.argv.slice(3).join(' ');

if (!file || !note) {
  console.error('Usage: update-operating-context.js <context.md> <note>');
  process.exit(2);
}

let text = '';
if (fs.existsSync(file)) {
  text = fs.readFileSync(file, 'utf8');
} else {
  text = '# OGSM Operating Context\n\n## Recurring Patterns\n\n';
}

const date = new Date().toISOString().slice(0, 10);
const entry = `\n- ${date}: ${note}\n`;

if (text.includes('## Recurring Patterns')) {
  text = text.replace(/(## Recurring Patterns\s*)/m, `$1${entry}`);
} else {
  text += `\n## Recurring Patterns\n${entry}`;
}

fs.writeFileSync(file, text);
console.log(`Updated ${file}`);
```

- [ ] **Step 5: Create script smoke test**

Write `ogsm/scripts/test-scripts.sh`:

```sh
#!/bin/sh
set -eu

node ogsm/scripts/validate-profile.js ogsm/examples/sample-ogsm-profile.md
node ogsm/scripts/normalize-schedule.js ogsm/examples/sample-schedule-input.md

tmp_json="$(mktemp)"
cat > "$tmp_json" <<'JSON'
[
  {"title":"Dashboard prototype","strategyLink":"Strategy 1","mdLink":"MD 1","mpLink":"MP 1"},
  {"title":"Exploratory calls","strategyLink":"Unmapped","mdLink":"Unmapped","mpLink":"Unmapped"}
]
JSON
node ogsm/scripts/score-alignment.js "$tmp_json"
rm "$tmp_json"

tmp_context="$(mktemp)"
node ogsm/scripts/update-operating-context.js "$tmp_context" "Strategy 1 was under-supported"
test -s "$tmp_context"
rm "$tmp_context"
```

- [ ] **Step 6: Make scripts executable**

Run:

```bash
chmod +x ogsm/scripts/validate-profile.js ogsm/scripts/normalize-schedule.js ogsm/scripts/score-alignment.js ogsm/scripts/update-operating-context.js ogsm/scripts/test-scripts.sh
```

Expected: command exits with status `0`.

- [ ] **Step 7: Run script tests**

Run:

```bash
ogsm/scripts/test-scripts.sh
```

Expected: output includes JSON from validator and scorer, normalized schedule table, and `Updated`.

- [ ] **Step 8: Commit**

Run:

```bash
git add ogsm/scripts
git commit -m "feat: add OGSM utility scripts"
```

Expected: commit succeeds.

## Task 5: Skill Entrypoints

**Files:**
- Create: `ogsm/skills/ogsm-define/SKILL.md`
- Create: `ogsm/skills/ogsm-translate/SKILL.md`
- Create: `ogsm/skills/ogsm-audit-plan/SKILL.md`
- Create: `ogsm/skills/ogsm-audit-schedule/SKILL.md`
- Create: `ogsm/skills/ogsm-calendar-brief/SKILL.md`
- Create: `ogsm/skills/ogsm-realign/SKILL.md`
- Create: `ogsm/skills/ogsm-weekly-review/SKILL.md`

- [ ] **Step 1: Create `ogsm-define` skill**

Write `ogsm/skills/ogsm-define/SKILL.md`:

```markdown
---
name: ogsm-define
description: Use when the user wants to create, repair, or update an OGSM profile, or when another OGSM skill cannot find a usable profile.
---

# OGSM Define

Use this skill to build the user's baseline OGSM profile.

## Inputs

- User's natural language goals, context, constraints, or existing OGSM draft.

## Outputs

- Confirmed OGSM profile in the format from `../../references/ogsm-profile-format.md`.

## Workflow

1. Read `../../references/ogsm-profile-format.md` and `../../references/ogsm-principles.md`.
2. If the user has no draft, ask one question at a time until Objective, Goals, Strategies, MD, MP, and Review Cadence are clear.
3. Use `../../assets/profile-template.md` as the profile skeleton.
4. Run `node ../../scripts/validate-profile.js <profile-file>` after drafting a saved profile.
5. Ask the user to confirm before saving or changing Objective, Goals, Strategies, MD, or MP.

## Progressive Disclosure

- Read profile format only when creating or validating a profile.
- Read principles when judging profile quality.
- Use the template only when drafting final profile text.

## Tools

- May read and write local profile files after confirmation.
- May run profile validation script.
- Must not use Google Calendar.
- Must not silently update existing OGSM fields.
```

- [ ] **Step 2: Create `ogsm-translate` skill**

Write `ogsm/skills/ogsm-translate/SKILL.md`:

```markdown
---
name: ogsm-translate
description: Use when the user wants to turn an OGSM profile into weekly or monthly priorities, time allocation guidance, or decision rules.
---

# OGSM Translate

Use this skill to convert OGSM into operational guidance.

## Inputs

- Confirmed OGSM profile.
- Optional adaptive operating context.
- Optional current focus period.

## Outputs

- Priority themes.
- Strategy time allocation guidance.
- MD check-ins.
- MP priorities.
- Say-no list.
- Decision rules.

## Workflow

1. Read the OGSM profile.
2. Read `../../references/adaptive-operating-context.md` only if context exists or the user asks for adaptive guidance.
3. Read `../../references/review-rubric.md` when prioritization requires tradeoff scoring.
4. Produce operational guidance for the requested period.
5. Ask for confirmation before writing operating context updates.

## Progressive Disclosure

- Do not load schedule normalization unless a schedule appears.
- Do not load output templates unless the user asks for a formatted artifact.

## Tools

- May read profile and operating context.
- May write operating context after confirmation.
- Must not use Google Calendar.
```

- [ ] **Step 3: Create `ogsm-audit-plan` skill**

Write `ogsm/skills/ogsm-audit-plan/SKILL.md`:

```markdown
---
name: ogsm-audit-plan
description: Use when the user wants to review a written plan, OKR, roadmap, project spec, weekly plan, or initiative list against their OGSM.
---

# OGSM Audit Plan

Use this skill to evaluate written plans against OGSM.

## Inputs

- Confirmed OGSM profile.
- Plan text, OKR, roadmap, project spec, or initiative list.
- Optional requested output mode: quick, full, or realign.

## Outputs

- Alignment review using `../../references/output-formats.md`.

## Workflow

1. Read the OGSM profile. If missing, route to `ogsm-define`.
2. Read `../../references/review-rubric.md`.
3. Read `../../references/output-formats.md`.
4. Map each plan item to Strategy, MD, and MP.
5. Check backward logic: MP should achieve MD, MD should validate Strategy, Strategy should support Goal, and Goal should support Objective.
6. Use `node ../../scripts/score-alignment.js <items.json>` when structured alignment items are available.
7. Ask one clarifying question only if it changes the review.
8. Offer `ogsm-realign` if the user wants a revised version.

## Progressive Disclosure

- Read examples only if the user asks for examples or output calibration.
- Do not read schedule normalization unless calendar or agenda content appears.

## Tools

- May read profile, rubric, output format, and adaptive context.
- May run alignment scoring script.
- May save review output if the user asks.
- Must not use Google Calendar.
```

- [ ] **Step 4: Create `ogsm-audit-schedule` skill**

Write `ogsm/skills/ogsm-audit-schedule/SKILL.md`:

```markdown
---
name: ogsm-audit-schedule
description: Use when the user wants to review a weekly schedule, agenda dump, or normalized calendar brief against their OGSM.
---

# OGSM Audit Schedule

Use this skill to determine whether time allocation supports OGSM.

## Inputs

- Confirmed OGSM profile.
- Manual agenda dump or normalized summary from `ogsm-calendar-brief`.
- Optional output mode: quick, full, or realign.

## Outputs

- Schedule alignment review.
- Time allocation risks.
- Suggested changes.

## Workflow

1. Read the OGSM profile. If missing, route to `ogsm-define`.
2. Read `../../references/schedule-normalization.md`.
3. Normalize input with `node ../../scripts/normalize-schedule.js <schedule-file>` when schedule text is saved.
4. Ask the user to confirm assumptions if normalization confidence is low.
5. Read `../../references/review-rubric.md` and `../../references/output-formats.md`.
6. Score Strategy, MD, and MP support.
7. Check whether calendar events actually execute MP and include MD check-ins.
8. Offer `ogsm-realign` for a revised weekly allocation.

## Progressive Disclosure

- Do not call Google Calendar directly.
- Only read calendar connector guidance when invoked through `ogsm-calendar-brief`.

## Tools

- May read profile, schedule normalization reference, rubric, and output formats.
- May run schedule normalization and alignment scoring scripts.
- May consume `ogsm-calendar-brief` output.
- Must not directly use Google Calendar connector.
- Must not modify calendar events.
```

- [ ] **Step 5: Create `ogsm-calendar-brief` skill**

Write `ogsm/skills/ogsm-calendar-brief/SKILL.md`:

```markdown
---
name: ogsm-calendar-brief
description: Use when the user wants to prepare a Google Calendar week summary for OGSM schedule audit.
---

# OGSM Calendar Brief

Use this skill to prepare schedule input for `ogsm-audit-schedule`.

## Inputs

- Date range.
- Calendar connector availability.

## Outputs

- Normalized schedule summary.

## Workflow

1. Confirm the date range.
2. If Google Calendar connector is available, read events for the date range.
3. If connector is unavailable, ask the user to paste an agenda dump.
4. Read `../../references/schedule-normalization.md`.
5. Produce the normalized schedule table.
6. Hand off to `ogsm-audit-schedule` when the user wants alignment review.

## Progressive Disclosure

- Do not read OGSM rubric because this skill does not score alignment.
- Do not load realign templates.

## Tools

- May use Google Calendar connector to read events.
- Must not modify calendar events.
- Must fall back to manual agenda input when connector is unavailable.
```

- [ ] **Step 6: Create `ogsm-realign` skill**

Write `ogsm/skills/ogsm-realign/SKILL.md`:

```markdown
---
name: ogsm-realign
description: Use after an OGSM audit when the user wants a revised plan, weekly schedule, or action list that better supports their OGSM.
---

# OGSM Realign

Use this skill to produce an executable corrected version.

## Inputs

- OGSM profile.
- Audit findings.
- Original plan or schedule.

## Outputs

- Revised plan or schedule.
- Change log.
- Delete, defer, delegate, shorten, move, and add decisions.

## Workflow

1. Read the OGSM profile.
2. Read audit findings.
3. Read `../../references/output-formats.md` and `../../assets/realign-template.md`.
4. Convert findings into concrete edits.
5. Explain each change with MP, MD, Strategy, Goal, or Objective linkage.
6. Ask for confirmation before saving output.

## Progressive Disclosure

- Read schedule normalization only when realigning a schedule.
- Read adaptive context only when previous preferences should affect the rewrite.

## Tools

- May read profile, audit output, decision rules, and templates.
- May write revised output if the user asks.
- Must not modify calendar or external documents directly.
```

- [ ] **Step 7: Create `ogsm-weekly-review` skill**

Write `ogsm/skills/ogsm-weekly-review/SKILL.md`:

```markdown
---
name: ogsm-weekly-review
description: Use at the end of a week to review OGSM execution, MD progress, MP completion, strategy time allocation, and adaptive operating context updates.
---

# OGSM Weekly Review

Use this skill to close the OGSM operating loop.

## Inputs

- OGSM profile.
- Week plan, schedule audit, completed work, or user reflection.
- Optional operating context.

## Outputs

- Weekly execution review.
- MD movement summary.
- MP completion summary.
- Under-supported Strategy findings.
- Proposed operating context updates.

## Workflow

1. Read the OGSM profile.
2. Read `../../references/adaptive-operating-context.md`.
3. Compare actual work against Strategies, MD, and MP.
4. Identify recurring patterns.
5. Propose operating context updates.
6. Use `node ../../scripts/update-operating-context.js <context-file> <note>` only after user confirmation.
7. If OGSM changes are needed, propose a diff and ask for confirmation.

## Progressive Disclosure

- Read review rubric only when scoring the week.
- Read output formats only when the user asks for a saved report.

## Tools

- May read profile, review history, and operating context.
- May update operating context after confirmation.
- Must not silently change Objective, Goals, Strategies, MD, or MP.
```

- [ ] **Step 8: Verify skill metadata**

Run:

```bash
grep -R "^name:" ogsm/skills/*/SKILL.md
grep -R "^description:" ogsm/skills/*/SKILL.md
grep -R "## Progressive Disclosure" ogsm/skills/*/SKILL.md
grep -R "## Tools" ogsm/skills/*/SKILL.md
```

Expected: each command prints seven matching files or sections.

- [ ] **Step 9: Commit**

Run:

```bash
git add ogsm/skills
git commit -m "feat: add OGSM skill entrypoints"
```

Expected: commit succeeds.

## Task 6: Architecture Validation

**Files:**
- Create: `ogsm/scripts/validate-architecture.sh`
- Modify: `ogsm/scripts/test-scripts.sh`

- [ ] **Step 1: Create architecture validator**

Write `ogsm/scripts/validate-architecture.sh`:

```sh
#!/bin/sh
set -eu

skills="ogsm-define ogsm-translate ogsm-audit-plan ogsm-audit-schedule ogsm-calendar-brief ogsm-realign ogsm-weekly-review"

test -f ogsm/plugin.toml
test -f ogsm/README.md

for skill in $skills; do
  test -f "ogsm/skills/$skill/SKILL.md"
  test -d "ogsm/skills/$skill/references"
  test -d "ogsm/skills/$skill/scripts"
  test -d "ogsm/skills/$skill/assets"
  grep -q '^name:' "ogsm/skills/$skill/SKILL.md"
  grep -q '^description:' "ogsm/skills/$skill/SKILL.md"
  grep -q '## Workflow' "ogsm/skills/$skill/SKILL.md"
  grep -q '## Progressive Disclosure' "ogsm/skills/$skill/SKILL.md"
  grep -q '## Tools' "ogsm/skills/$skill/SKILL.md"
done

for reference in ogsm-principles ogsm-profile-format review-rubric schedule-normalization output-formats adaptive-operating-context tool-policy progressive-disclosure; do
  test -f "ogsm/references/$reference.md"
done

for asset in profile-template operating-context-template quick-review-template full-audit-template realign-template; do
  test -f "ogsm/assets/$asset.md"
done

for script in validate-profile normalize-schedule score-alignment update-operating-context; do
  test -x "ogsm/scripts/$script.js"
done

grep -q 'Must not directly use Google Calendar connector' ogsm/skills/ogsm-audit-schedule/SKILL.md
grep -q 'May use Google Calendar connector to read events' ogsm/skills/ogsm-calendar-brief/SKILL.md
```

- [ ] **Step 2: Make architecture validator executable**

Run:

```bash
chmod +x ogsm/scripts/validate-architecture.sh
```

Expected: command exits with status `0`.

- [ ] **Step 3: Update script smoke test**

Modify `ogsm/scripts/test-scripts.sh` to append this line before the end of the file:

```sh
ogsm/scripts/validate-architecture.sh
```

The final file should be:

```sh
#!/bin/sh
set -eu

node ogsm/scripts/validate-profile.js ogsm/examples/sample-ogsm-profile.md
node ogsm/scripts/normalize-schedule.js ogsm/examples/sample-schedule-input.md

tmp_json="$(mktemp)"
cat > "$tmp_json" <<'JSON'
[
  {"title":"Dashboard prototype","strategyLink":"Strategy 1","mdLink":"MD 1","mpLink":"MP 1"},
  {"title":"Exploratory calls","strategyLink":"Unmapped","mdLink":"Unmapped","mpLink":"Unmapped"}
]
JSON
node ogsm/scripts/score-alignment.js "$tmp_json"
rm "$tmp_json"

tmp_context="$(mktemp)"
node ogsm/scripts/update-operating-context.js "$tmp_context" "Strategy 1 was under-supported"
test -s "$tmp_context"
rm "$tmp_context"

ogsm/scripts/validate-architecture.sh
```

- [ ] **Step 4: Run architecture validation**

Run:

```bash
ogsm/scripts/validate-architecture.sh
```

Expected: command exits with status `0`.

- [ ] **Step 5: Run full smoke test**

Run:

```bash
ogsm/scripts/test-scripts.sh
```

Expected: command exits with status `0` and prints validation/scoring output.

- [ ] **Step 6: Commit**

Run:

```bash
git add ogsm/scripts
git commit -m "test: add OGSM architecture validation"
```

Expected: commit succeeds.

## Task 7: Final Documentation Review

**Files:**
- Modify: `ogsm/README.md`

- [ ] **Step 1: Update README with skill list**

Replace `ogsm/README.md` with:

```markdown
# OGSM Plugin

This plugin helps users make OGSM operational through a repeatable loop:

1. Define an OGSM profile.
2. Translate it into priorities and time allocation guidance.
3. Audit plans and schedules.
4. Realign work into a more executable version.
5. Review weekly execution and update adaptive context.

## Skills

- `ogsm-define`: create or repair the baseline OGSM profile.
- `ogsm-translate`: convert OGSM into priorities, time allocation, and decision rules.
- `ogsm-audit-plan`: review plans, OKRs, roadmaps, specs, and initiatives.
- `ogsm-audit-schedule`: review weekly schedules or agenda dumps.
- `ogsm-calendar-brief`: optionally prepare a Google Calendar summary for schedule audit.
- `ogsm-realign`: produce a revised plan or schedule after audit.
- `ogsm-weekly-review`: close the loop and update adaptive operating context.

## Architecture

The plugin uses progressive disclosure:

- `SKILL.md` files are short entrypoints.
- Long rules live in `references/`.
- Templates live in `assets/`.
- Repeatable mechanical work lives in `scripts/`.
- Examples live in `examples/`.

## Safety

The MVP never modifies calendars, external documents, Objective, Goals, Strategies, MD, or MP without explicit user confirmation.

If Google Calendar is unavailable, the calendar workflow falls back to manual agenda input.

## Validation

Run:

```bash
ogsm/scripts/test-scripts.sh
```
```

- [ ] **Step 2: Run final validation**

Run:

```bash
ogsm/scripts/test-scripts.sh
git status --short
```

Expected: script exits with status `0`; `git status --short` shows only `M ogsm/README.md`.

- [ ] **Step 3: Commit**

Run:

```bash
git add ogsm/README.md
git commit -m "docs: document OGSM plugin usage"
```

Expected: commit succeeds.

## Self-Review Checklist

- [ ] Spec coverage: plugin skeleton, skills, references, scripts, assets, examples, tools, optional calendar path, adaptive context, and validation are all mapped to tasks.
- [ ] Placeholder scan: plan contains no unresolved marker text or vague future-work instructions.
- [ ] Type consistency: script names, file paths, and skill names are consistent across tasks.
- [ ] Progressive disclosure: each skill has `SKILL.md`, references/scripts/assets directories, `## Progressive Disclosure`, and `## Tools`.
- [ ] Calendar boundary: `ogsm-audit-schedule` does not call Google Calendar; `ogsm-calendar-brief` is the only MVP skill that may read it.
- [ ] Final validation: `ogsm/scripts/test-scripts.sh` passes.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-05-ogsm-plugin-implementation.md`. Two execution options:

1. Subagent-Driven (recommended) - dispatch a fresh subagent per task, review between tasks, fast iteration.
2. Inline Execution - execute tasks in this session using executing-plans, batch execution with checkpoints.
