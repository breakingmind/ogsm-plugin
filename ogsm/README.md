# OGSM Plugin

This plugin helps users make OGSM operational through a repeatable loop:

1. Define an OGSM profile.
2. Translate it into priorities and time allocation guidance.
3. Audit plans and schedules.
4. Realign work into a more executable version.
5. Review weekly execution and update adaptive context.

## Skills

- `ogsm-define`: create or repair the baseline OGSM profile.
- `ogsm-translate`: convert OGSM into priorities, time allocation, and decision rules.
- `ogsm-audit-plan`: review plans, OKRs, roadmaps, specs, and initiatives.
- `ogsm-audit-schedule`: review weekly schedules or agenda dumps.
- `ogsm-calendar-brief`: optionally prepare a Google Calendar summary for schedule audit.
- `ogsm-realign`: produce a revised plan or schedule after audit.
- `ogsm-weekly-review`: close the loop and update adaptive operating context.

## Architecture

The plugin uses progressive disclosure:

- `SKILL.md` files are short entrypoints.
- Long rules live in `references/`.
- Templates live in `assets/`.
- Repeatable mechanical work lives in `scripts/`.
- Examples live in `examples/`.

## Safety

The MVP never modifies calendars, external documents, Objective, Goals, Strategies, MD, or MP without explicit user confirmation.

If Google Calendar is unavailable, the calendar workflow falls back to manual agenda input.

## Validation

Run:

```bash
ogsm/scripts/test-scripts.sh
```
