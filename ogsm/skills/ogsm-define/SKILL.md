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
