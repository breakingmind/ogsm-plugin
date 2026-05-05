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
