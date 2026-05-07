# Tool Policy

## Allowed Tools

- Read local plugin files, references, assets, examples, profiles, and operating context.
- Write local profile, operating context, and review outputs after user confirmation.
- Prepare project-local `.ogsm/` storage after user confirmation.
- Execute plugin scripts for validation, normalization, and scoring.
- Execute context update scripts only after user confirmation.
- Use Google Calendar connector only from `ogsm-calendar-brief`.

## Restricted Tools

- Do not modify calendar events in MVP.
- Do not modify external documents in MVP.
- Do not update Objective, Goals, Strategies, MD, or MP without explicit confirmation.
- Do not write `.ogsm/` profile, context, or review files without explicit confirmation.
- Do not treat connector failure as workflow failure.

## Fallbacks

- If Google Calendar is unavailable, ask for manual agenda input.
- If scripts are unavailable, perform the workflow manually and state the fallback.
- If profile data is incomplete, ask for the smallest missing field before scoring.
- If persistent storage is not initialized, offer project-local `.ogsm/` storage or continue with conversation-only mode.
