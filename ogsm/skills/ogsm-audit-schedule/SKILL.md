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
