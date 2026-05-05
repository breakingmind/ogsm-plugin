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
6. If saving output, read `../../references/storage-policy.md`, show target path and summary or diff, then ask for confirmation before writing.

## Progressive Disclosure

- Read schedule normalization only when realigning a schedule.
- Read adaptive context only when previous preferences should affect the rewrite.
- Read storage policy only when saving output.

## Tools

- May read profile, audit output, decision rules, and templates.
- May write revised output only after storage policy, target path, summary or diff, and confirmation.
- Must not modify calendar or external documents directly.
