# Storage Policy

Persistent OGSM storage is project-local by default.

The plugin must not silently write confirmed profiles, operating context, review outputs, or OGSM changes. Any write requires:

1. Target path
2. Content summary
3. Diff or explicit new-file notice
4. User confirmation
5. Recorded date

## Default Directory

Use `.ogsm/` at the user's current project root.

```text
.ogsm/
  index.md
  profiles/
    company/
    departments/
  context/
    company/
    departments/
  reviews/
    company/
    departments/
  plans/
    company/
    departments/
  archive/
    company/
    departments/
```

## Scope Types

Use one of these scope types:

- `company`: organization-wide OGSM.
- `department`: department, function, or team OGSM that should align to a company OGSM.

Use lowercase slug names for files and folders, such as `double-steel`, `sales`, or `operations`.

## Default Paths

Company profile:

```text
.ogsm/profiles/company/<company-slug>.md
```

Company operating context:

```text
.ogsm/context/company/<company-slug>.md
```

Company review outputs:

```text
.ogsm/reviews/company/<company-slug>/<YYYY-MM-DD>-<review-type>.md
```

Department profile:

```text
.ogsm/profiles/departments/<department-slug>.md
```

Department operating context:

```text
.ogsm/context/departments/<department-slug>.md
```

Department review outputs:

```text
.ogsm/reviews/departments/<department-slug>/<YYYY-MM-DD>-<review-type>.md
```

## Profile Metadata

Every saved profile should start with metadata:

```yaml
---
scope: company
slug: double-steel
parent: null
owner_unit: management
time_horizon: 2026-05-05 to 2026-11-05
last_confirmed: 2026-05-05
---
```

Department profiles should reference their parent company profile:

```yaml
---
scope: department
slug: sales
parent: company/double-steel
owner_unit: sales
time_horizon: 2026-05-05 to 2026-11-05
last_confirmed: 2026-05-05
---
```

## Parent Alignment

Department profiles must declare how each Goal relates to the company OGSM using inline annotations. See `references/ogsm-profile-format.md` for the full annotation syntax.

### Rules

- Every department Goal must have a `goal_type` annotation. Missing annotations produce a warning during validation.
- `aligned` Goals must declare a `parent_ref` pointing to an existing company layer (`company-G1`, `company-S2`, etc.). Invalid `parent_ref` is an error that blocks saving.
- `enabling` Goals must list `supports` departments. Missing `supports` is a warning.
- Company Objective alignment is confirmed conversationally during `ogsm-define` — no annotation required.
- MP `depends_on` references are advisory and surfaced during audit, not validated structurally.

### Validation

Run alignment validation for a department profile:

```bash
node scripts/validate-alignment.js .ogsm/profiles/departments/<slug>.md .ogsm/profiles/company/<slug>.md
```

Output: `{ "valid": bool, "warnings": [], "errors": [] }`
- Errors: block save in `ogsm-define`
- Warnings: surfaced to user but do not block save

## Update Diff Format

Before changing an existing profile, show:

```text
Target: .ogsm/profiles/departments/sales.md
Reason: clarify G2 baseline

Before:
<old excerpt>

After:
<new excerpt>

Backward linkage impact:
MP -> MD -> S -> G -> O
```

For new files, show the target path and a short content summary before asking for confirmation.

## Sensitive Data

Profiles and context may contain company-sensitive information. The plugin should:

- Prefer project-local `.ogsm/` storage.
- Avoid writing real customer names unless the user confirms.
- Avoid writing profile or context data to GitHub, Linear, calendars, or external documents unless the user explicitly requests it.
- Suggest placeholder names such as `Customer A` when examples are enough.

## Annual Plan Paths

Annual plan tables are stored under `.ogsm/plans/`:

```text
.ogsm/plans/company/<company-slug>/<year>-annual.md
.ogsm/plans/departments/<dept-slug>/<year>-annual.md
```

These follow the same safety constraints as all other `.ogsm/` writes: target path, content summary, and explicit user confirmation are required before any write.
