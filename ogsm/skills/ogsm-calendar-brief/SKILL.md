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

- Normalized schedule summary using the schedule normalization table schema.

## Workflow

1. Confirm the date range.
2. If Google Calendar connector is available, read events for the date range.
3. If connector is unavailable, ask the user to paste an agenda dump.
4. Read `../../references/schedule-normalization.md`.
5. Produce the normalized schedule table using the exact schema before handoff.
6. If the user asks to audit Google Calendar directly, first produce the normalized brief here, then hand off to `ogsm-audit-schedule` to score alignment.
7. Hand off to `ogsm-audit-schedule` when the user wants alignment review; do not score alignment in this skill.

## Progressive Disclosure

- Do not read OGSM rubric because this skill does not score alignment.
- Do not load realign templates.
- Do not read storage policy unless the user asks to save the calendar brief.

## Tools

- May use Google Calendar connector to read events.
- May save the normalized brief only after storage policy, profile metadata scope and slug, target path, summary or diff, recorded date, and confirmation. If metadata is missing, ask for scope and slug before saving.
- Must not modify calendar events.
- Must fall back to manual agenda input when connector is unavailable.
