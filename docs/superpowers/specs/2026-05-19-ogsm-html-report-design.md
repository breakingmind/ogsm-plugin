# OGSM HTML Execution Report — Design Spec

Date: 2026-05-19  
Related issues: DOU-45, DOU-46, DOU-47, DOU-48, DOU-49, DOU-50, DOU-51, DOU-52, DOU-53, DOU-54, DOU-55, DOU-56

## Goal

Produce a single, self-contained HTML execution report from `.ogsm/` data. The report answers two core questions for any organization using the OGSM plugin:

1. **Where are we?** — overall health, per-Goal progress, MD status
2. **What did we do?** — MP completion, MD actual updates this period

The report serves meeting projection, async reading, and print/archive. It is generated on demand by the user via `ogsm-render-status`, never automatically.

## Design Direction

**Two-section layout (C)**, with a planned evolution toward a health dashboard (B) once the progress and health computation engine (DOU-48/49) is complete.

MVP uses light interactivity via native HTML `<details>` — no JavaScript framework, no external dependencies, offline-capable, print-friendly.

## Plugin Workflow Position

```
ogsm-define → ogsm-translate → ogsm-audit-plan / ogsm-weekly-review
                                          ↓
                               ogsm-render-status  (new skill, user-triggered)
                                          ↓
                    .ogsm/reports/<scope>/<slug>/<YYYY-MM-DD>-status.html
```

`ogsm-render-status` reads `.ogsm/` data, builds the view model, renders the HTML, and writes the output file after user confirmation. It does not modify any other `.ogsm/` file.

## Input Sources

| Source | Content read |
|--------|-------------|
| `.ogsm/profiles/company/<slug>.md` | O, G, S, MD, MP definitions |
| `.ogsm/profiles/departments/*.md` | Department profiles with `parent_ref` annotations |
| `.ogsm/reviews/<scope>/<slug>/*.md` | `md-actual` markers from weekly/monthly reviews |
| `.ogsm/plans/<scope>/<slug>/*.md` | Annual plan tables |

## Output Path

```
.ogsm/reports/company/<slug>/<YYYY-MM-DD>-status.html
.ogsm/reports/departments/<slug>/<YYYY-MM-DD>-status.html
```

Single HTML file, inline CSS, no external dependencies.

## Report Layout

```
┌─────────────────────────────────────────┐
│  HEADER                                 │
│  Org name | Period | Generated at       │
├─────────────────────────────────────────┤
│  SECTION 1: WHERE ARE WE?               │
│                                         │
│  [Objective text]                       │
│                                         │
│  Goal 1  ████████░░  80%  🟢 On Track  │
│  Goal 2  ████░░░░░░  40%  🔴 Off Track │
│  Goal 3  ██████░░░░  60%  🟡 At Risk   │
│                                         │
│  ▼ Strategy 1                           │
│    MD 1-1  target: X  actual: Y         │
│    MD 1-2  target: X  actual: Y         │
│    <details> Dept: Sales    </details>  │
│    <details> Dept: Operations </details>│
│                                         │
│  ▼ Strategy 2 ...                       │
├─────────────────────────────────────────┤
│  SECTION 2: WHAT DID WE DO?             │
│                                         │
│  MP Status this period                  │
│  ✅ MP 1  done   ⬜ MP 2  in progress   │
│  ⬜ MP 3  not started  ❌ MP 4  delayed │
│                                         │
│  MD Updates (from md-actual)            │
│  MD1-1: baseline → actual (delta)       │
│                                         │
│  <details> Department detail </details> │
├─────────────────────────────────────────┤
│  FOOTER                                 │
│  Source paths | Plugin version          │
└─────────────────────────────────────────┘
```

Department `<details>` sections are placed according to the department profile's `parent_ref` annotation:

| `parent_ref` value | Placement |
|--------------------|-----------|
| `company-S1` (specific Strategy) | Under that Strategy's block |
| `company-G1` (Goal level) | After the last Strategy under that Goal |
| `company` or null | Separate "Departments" section at the bottom of Section 1 |

## Unified View Model

The renderer depends only on this model, never on raw `.ogsm/` files directly.

```
{
  meta: {
    scope: "company" | "department",
    slug: string,
    period: string,
    generated_at: string,          // YYYY-MM-DD
    health: "on_track" | "at_risk" | "off_track" | "no_data"
  },

  objective: { text: string },

  goals: [
    {
      id: string,                  // "G1", "G2", ...
      text: string,
      health: "on_track" | "at_risk" | "off_track" | "no_data",
      progress_pct: number | null, // null if no actuals available
      strategies: [
        {
          id: string,              // "S1", "S2", ...
          text: string,
          measures: [
            {
              id: string,          // "MD1-1", ...
              text: string,
              baseline: string | null,
              target: string | null,
              actual: string | null,    // null = not yet recorded
              status: "on_track" | "at_risk" | "off_track" | "no_data"
            }
          ],
          plans: [
            {
              id: string,          // "MP1", ...
              text: string,
              owner: string | null,
              // status derived by loader from weekly review MP completion records;
              // falls back to "not_started" if no review data exists for this MP
              status: "done" | "in_progress" | "not_started" | "delayed"
            }
          ],
          departments: [           // departments whose parent_ref points to this S
            {
              slug: string,
              name: string,
              measures: [...],     // same shape as company measures
              plans: [...]
            }
          ]
        }
      ]
    }
  ]
}
```

### null vs "no_data"

- `null` — field does not exist in source data
- `"no_data"` — field exists but no actual has been recorded yet

This distinction prevents treating untracked items as 0% progress.

## Health Status Rules (MVP)

Simple rules for the MVP phase, to be replaced by the computation engine from DOU-48/49:

| Status | Condition |
|--------|-----------|
| 🟢 On Track | All MDs have actuals and are at or above target |
| 🟡 At Risk | Some MDs have actuals but are below target |
| 🔴 Off Track | Any MD has no actual or is critically below target |
| ⚪ No Data | No actuals recorded for any MD |

## Graceful Degradation

| Situation | Behaviour |
|-----------|-----------|
| No reviews / no md-actual | Show full profile structure, all MDs marked ⚪ No Data, no progress bars |
| Some MDs have actuals | Render available actuals normally, mark missing ones ⚪ No Data |
| No department profiles | Omit department `<details>` sections silently |
| Missing profile fields (e.g., no MP section) | Show "not defined" placeholder, render rest normally |
| Unparseable actual value | Display raw text, do not compute progress, mark ⚪ No Data |
| Loader failure | CLI outputs error, no HTML produced |

**Minimum viable report:** A profile with no reviews still produces a valid report showing the full O → G → S → MD → MP structure with ⚪ No Data status. This serves as a "plan view" for verifying OGSM structure.

## Styling Constraints

- Inline CSS only — no `<link>` or `<script>` tags
- Native `<details>` / `<summary>` for expand/collapse
- Print-friendly: avoid fixed positioning, use `@media print` to expand all `<details>`
- Readable when projected: minimum 16px body font, high contrast status colours

## Implementation Sequence

1. **DOU-45** — Define this view model as a written spec (this document covers the contract)
2. **DOU-46** — Implement loader: reads `.ogsm/` sources → normalized source data → view model
3. **DOU-47** — Implement HTML renderer: view model → single HTML file (MVP layout above)
4. **DOU-48/49** — Define and implement progress/health computation engine
5. **DOU-50** — Replace MVP health rules with engine output in the renderer
6. **DOU-51/52/53** — Add alignment diagnostics sections
7. **DOU-54** — Add `render-ogsm-status` CLI and skill
8. **DOU-55/56** — Storage policy, workflow handoff, fixtures, smoke tests

## Future Evolution (Direction B)

Once DOU-48/49 delivers the health computation engine, the report can evolve toward a dashboard-first layout:

```
[Overall Health score]
[Goal cards: traffic lights at a glance]
[Expand individual Goals for detail]
```

The view model shape supports this without breaking changes — only the renderer template changes.

## Out of Scope

- Interactive charting (Chart.js, D3, etc.)
- Server-side rendering or live data refresh
- Pushing reports to external systems (GitHub, Linear, Google Drive)
- Auto-generation on schedule (covered by DOU-33)
