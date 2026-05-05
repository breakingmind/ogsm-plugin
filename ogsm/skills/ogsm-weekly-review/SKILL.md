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
