# Google Calendar Brief

Use this reference only from `ogsm-calendar-brief`.

## Connector Path

1. Confirm the date range and timezone.
2. Read calendar events only; do not create, edit, delete, accept, decline, or reschedule events.
3. Convert events into the normalized schedule table from `schedule-normalization.md`.
4. Mark Strategy Link, MD Link, and MP Link as `Unmapped` unless the event title, notes, or user-provided context makes the mapping explicit.
5. Keep connector failure non-blocking. If events cannot be read, ask the user to paste an agenda dump.

## Script Path

When calendar event JSON is saved locally, normalize it with:

```bash
node ../../scripts/normalize-calendar-events.js <calendar-events.json>
```

Expected calendar event JSON shape:

```json
[
  {
    "summary": "Pipeline review",
    "start": {"dateTime": "2026-05-11T09:00:00+08:00"},
    "end": {"dateTime": "2026-05-11T10:00:00+08:00"},
    "location": "Teams"
  }
]
```

The output must be a normalized schedule table, not a prose summary.

## Handoff

If the user wants an OGSM alignment review, hand the normalized table to `ogsm-audit-schedule`. `ogsm-calendar-brief` does not score alignment.
