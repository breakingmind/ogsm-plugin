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
