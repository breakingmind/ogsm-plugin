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

When a department profile exists, audits should check:

- Department Objective supports the company Objective.
- Department Goals support at least one company Goal.
- Department Strategies map to company Strategies or explain why they are local-only.
- Department MD and MP can be traced to department Strategies and, when applicable, to company Goals.

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
