# OGSM Alignment Diagnostics Rules

Date: 2026-05-19
Implements: DOU-51
Consumed by: DOU-52 (diagnose.js), DOU-53 (renderer.js)

## Goal Annotation Format

Department goal-level annotations are written inline on the same line as the
goal number so that `parseNumberedList` captures them in the goal text string.

```
1. Grow close rate from 20% to 35%. <!-- goal_type: aligned | parent_ref: company-G1 -->
2. Train reps on CRM. <!-- goal_type: enabling | supports: [sales] -->
```

`goal_type` values: `aligned` (tracks a company goal), `enabling` (supports
other units). A goal with neither is treated as having no annotation.

## Diagnostic Types

### Company Profile Diagnostics

| Type | Severity | Condition |
|------|----------|-----------|
| `strategy_no_md` | warning | Strategy[i] exists but `measures[i]` is absent or blank |
| `md_no_target` | warning | `measures[i]` exists but contains no `→` arrow |
| `md_no_evidence` | warning | `measures[i]` exists but no actual has been recorded |
| `no_plans` | warning | `profile.plans` is empty |

### Department Profile Diagnostics

| Type | Severity | Condition |
|------|----------|-----------|
| `missing_goal_type` | warning | Dept goal has no `<!-- goal_type: ... -->` annotation |
| `broken_parent_ref` | error | `parent_ref: company-Gn` where n > company goal count |

## Severity Levels

- **error**: Structural problem that will produce misleading report output (broken
  link, dangling reference). Reader cannot trust alignment data until resolved.
- **warning**: Coverage gap or missing annotation. Report remains valid but
  certain sections will show incomplete data.

## Output Structure

Each diagnostic item:

```json
{ "type": "strategy_no_md", "severity": "warning", "item_id": "S2", "message": "S2 has no corresponding measure (MD)." }
```

`item_id` is the closest identifiable element: strategy ID, MD ID, or
`<dept-slug>-G<n>` for department goals.

## Aggregation

Diagnostics are not aggregated — all items are returned in a flat array ordered
by: errors first, then warnings, then by item_id lexicographically.
