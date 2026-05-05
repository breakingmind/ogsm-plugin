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
