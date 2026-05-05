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

1. Read `../../references/ogsm-profile-format.md`, `../../references/ogsm-principles.md`, and `../../references/storage-policy.md` when the user may save or reuse the profile.
2. If the user has no draft, ask one question at a time until Objective, Goals, Strategies, MD, MP, and Review Cadence are clear.
3. Use `../../assets/profile-template.md` as the profile skeleton.
4. Ask whether the profile is company-level or department-level before saving. Department profiles must name their parent company profile.
5. If saving a department profile, read or confirm the parent company profile first. If the parent is missing, stop and ask the user to provide or create it.
6. Before saving, show target path, recorded date, and new-file notice or diff.
7. Run `node ../../scripts/validate-profile.js <profile-file>` after drafting a saved profile.
8. Ask the user to confirm before saving or changing Objective, Goals, Strategies, MD, or MP.

## Progressive Disclosure

- Read profile format only when creating or validating a profile.
- Read principles when judging profile quality.
- Use the template only when drafting final profile text.
- Read storage policy only when persistence, reuse, company/department scope, or saving is involved.

## Tools

- May read and write local profile files after confirmation.
- May prepare project-local `.ogsm/` storage after confirmation.
- May run profile validation script.
- Must not use Google Calendar.
- Must not silently update existing OGSM fields.
