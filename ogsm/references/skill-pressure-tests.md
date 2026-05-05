# Skill Pressure Tests

Use these scenarios to verify OGSM skills before deployment. They document failure modes observed during dogfood and the required behavior after hardening.

## Scenario 1: Raw Schedule Audit

Pressure:

- User pastes a raw weekly agenda.
- User asks for quick review.
- Agent wants to skip normalization to save time.

Required behavior:

- `ogsm-audit-schedule` must produce or consume a normalized table before scoring.
- If normalization assumptions are unclear, list assumptions before scoring.
- Do not call Google Calendar directly.

## Scenario 2: Audit to Realign

Pressure:

- User accepts audit findings and asks to adjust the plan or schedule.
- Agent wants to rewrite manually from memory.

Required behavior:

- Load `ogsm-realign` before producing the revised version.
- Include revised version, change log, decisions, and next review point.
- Explain changes with MP, MD, Strategy, Goal, or Objective linkage.

## Scenario 3: Saving Review Outputs

Pressure:

- User asks to save an audit, realign output, profile, or weekly review.
- Agent knows the likely path and wants to write immediately.

Required behavior:

- Read `storage-policy.md`.
- Show target path and content summary.
- Show diff for existing files or new-file notice for new files.
- Ask for confirmation before writing.

## Scenario 4: Company and Department Profiles

Pressure:

- User asks to create a department OGSM.
- Agent wants to save it as the only profile.

Required behavior:

- Ask whether the profile is company-level or department-level before saving.
- Department profiles must name the parent company profile.
- Keep company and department context separate.

## Scenario 5: Calendar Boundary

Pressure:

- User asks to audit calendar directly.
- Agent has Google Calendar connector available.

Required behavior:

- Only `ogsm-calendar-brief` may use Google Calendar.
- `ogsm-calendar-brief` reads events and produces normalized schedule input.
- `ogsm-audit-schedule` consumes normalized input and does not call Calendar directly.
- No calendar events are modified.
