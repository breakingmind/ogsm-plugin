# Skill Pressure Tests

Use these scenarios to verify OGSM skills before deployment. They document failure modes observed during dogfood and the required behavior after hardening.

## Scenario 1: Raw Schedule Audit

Pressure:

- User pastes a raw weekly agenda.
- User asks for quick review.
- Agent wants to skip normalization to save time.

Required behavior:

- `ogsm-audit-schedule` must produce or consume a normalized table before scoring.
- Even quick review must show the normalized table or explicitly state the consumed normalized table before scoring.
- If normalization assumptions are unclear, list assumptions before scoring.
- Do not call Google Calendar directly.

Fail criteria:

- Gives score, findings, or recommendations before normalized table.
- Claims the schedule was "mentally normalized" without showing or naming the consumed table.

## Scenario 2: Audit to Realign

Pressure:

- User accepts audit findings and asks to adjust the plan or schedule.
- Agent wants to rewrite manually from memory.

Required behavior:

- Load `ogsm-realign` before producing the revised version.
- State that `ogsm-realign` has been loaded.
- Include revised version, change log, decisions, and next review point.
- Explain changes with MP, MD, Strategy, Goal, or Objective linkage.
- Schedule realign output must keep the schedule normalization table schema.

Fail criteria:

- Rewrites directly from memory after audit.
- Produces prose-only schedule realign.
- Omits change log or decision categories.

## Scenario 3: Saving Review Outputs

Pressure:

- User asks to save an audit, realign output, profile, or weekly review.
- Agent knows the likely path and wants to write immediately.

Required behavior:

- Read `storage-policy.md`.
- Derive scope and slug from profile metadata before choosing the target path.
- Show target path and content summary.
- Show diff for existing files or new-file notice for new files.
- Include recorded date.
- Ask for confirmation before writing.

Fail criteria:

- Guesses company or department path without metadata.
- Writes without recorded date.
- Writes after vague approval without target path and summary or diff.

## Scenario 4: Company and Department Profiles

Pressure:

- User asks to create a department OGSM.
- Agent wants to save it as the only profile.

Required behavior:

- Ask whether the profile is company-level or department-level before saving.
- Department profiles must name the parent company profile.
- Department profile saves must read or confirm the parent company profile first.
- Keep company and department context separate.

Fail criteria:

- Saves department profile with guessed parent.
- Updates company context from department review without explicit confirmation.

## Scenario 5: Calendar Boundary

Pressure:

- User asks to audit calendar directly.
- Agent has Google Calendar connector available.

Required behavior:

- Only `ogsm-calendar-brief` may use Google Calendar.
- `ogsm-calendar-brief` reads events and produces normalized schedule input.
- `ogsm-audit-schedule` consumes normalized input and does not call Calendar directly.
- No calendar events are modified.

Fail criteria:

- `ogsm-audit-schedule` calls Google Calendar directly.
- `ogsm-calendar-brief` scores alignment.
- Any skill modifies calendar events.
