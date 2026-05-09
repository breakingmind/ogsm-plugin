# OGSM Profile Format

The canonical profile is Markdown.

## Required Sections

- Profile Name
- Time Horizon
- Objective
- Goals
- Strategies
- MD
- MP
- Review Cadence

## Recommended Sections

- Current Focus Period
- Strategy Priority Weights
- Preferred Working Rhythm
- Known Constraints
- Decision Rules
- Last Reviewed Date

## Recommended Metadata

Saved profiles should include frontmatter so company and department OGSMs can coexist:

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

For department profiles, set `scope: department` and reference the company parent, for example `parent: company/double-steel`.

## Quality Rules

- Objective must name target audience, service scope, value, positioning, and a vivid picture of success.
- Goals must connect to Objective keywords and include verb, noun, baseline, target or total amount, and date range.
- Strategies must describe selected resources, methodology, and tools, not all possible work.
- MD must include indicator, baseline, target or total amount, date or period, review cadence, and the Strategy it validates.
- MP must include owner or unit, collaborating unit when relevant, time order, date or period, and work content.
- Each MP should connect to an MD; each MD should validate a Strategy; each Strategy should support a Goal.
- Department profiles should explicitly name the company profile they align to.
- Unknown required fields must be marked as missing and clarified with the user, or represented with an explicit proxy, instead of treated as complete.

## Department Goal Annotations

Department profiles must annotate each Goal with a `goal_type` HTML comment placed on the line immediately after the Goal text:

```markdown
## Goals

1. 將新客戶成交率從 20% 提升至 35%，2026-12-31 前。
   <!-- goal_type: aligned | parent_ref: company-G1 -->

2. 完成 CRM 全員培訓，2026-08-31 前。
   <!-- goal_type: enabling | supports: [sales, operations] -->
```

### goal_type: aligned

The Goal traces to a specific layer of the parent company OGSM.

- `parent_ref` must be one of: `company-O`, `company-G1`, `company-G2`, … `company-S1`, `company-S2`, …
- Index numbers correspond to the numbered order of Goals or Strategies in the company profile.
- `parent_ref` is required for `aligned` goals. Missing `parent_ref` is an error that blocks saving.

### goal_type: enabling

The Goal supports other departments' ability to execute. It does not map to a specific company layer.

- `supports` lists department slugs this Goal serves (comma-separated inside `[…]`).
- Missing `supports` is a warning, not an error.

## MP Cross-Department Dependencies

An MP entry may optionally declare a dependency on another department's MP:

```markdown
## MP

3. IT 部門，協作：業務部門，完成 CRM 系統上線，2026-07-31
   <!-- depends_on: sales/MP2 -->
```

`depends_on` format: `<dept-slug>/MP<number>`. This is advisory; it is surfaced during audits but does not block saves.
