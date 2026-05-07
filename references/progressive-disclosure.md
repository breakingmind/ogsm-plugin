# Progressive Disclosure

Each `SKILL.md` is an entrypoint, not a full manual.

references/output-formats.md defines format contracts; reusable filled skeletons belong in assets/.

Keep in `SKILL.md`:

- Trigger conditions
- Inputs and outputs
- Short workflow
- Tool policy summary
- References to load only when needed

Move to `references/`:

- Rubrics
- Long rules
- Anti-patterns
- Schemas

Move to `assets/`:

- Templates
- Output skeletons
- Reusable Markdown snippets

Move to `scripts/`:

- Validation
- Normalization
- Scoring
- Context updates

## Cross-Skill Handoffs

- Google Calendar audit request: use `ogsm-calendar-brief` to produce normalized schedule input, then use `ogsm-audit-schedule` to score alignment.
- Revised plan or schedule request after audit: use `ogsm-realign` before producing revised output.
- Save request: read `storage-policy.md` before writing profile, context, review, brief, or realign output.
