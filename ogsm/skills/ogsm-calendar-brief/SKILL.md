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
