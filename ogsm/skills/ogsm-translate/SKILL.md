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
