# OGSM Progress Scoring & Health Rules

Date: 2026-05-19
Implements: DOU-48
Consumed by: DOU-49 (compute.js), DOU-50 (renderer.js)

## MD Text Format

Profile MD lines follow the pattern `<label>: <baseline> → <target>, ...`
The `→` arrow separates baseline from target. Both must be numeric for
progress computation.

Example: `Monthly revenue: 100 → 120, 2026-03-31, monthly, validates S1.`

## MD-Level Progress

| Case | Actual | Baseline | Target | progress_pct | status |
|------|--------|----------|--------|-------------|--------|
| No actual | null | any | any | null | no_data |
| Qualitative done | "完成"/"done"/"completed"/"✅" | any | any | 100 | on_track |
| Qualitative in progress | "進行中"/"in_progress"/"🔄" | any | any | 50 | at_risk |
| Qualitative not started | "未開始"/"not_started"/"⬜" | any | any | 0 | off_track |
| Numeric, increase target (T > B) | N | B | T | min(100, round(N/T×100)) | see thresholds |
| Numeric, decrease target (T < B) | N | B | T | min(100, round(T/N×100)) | see thresholds |
| Numeric, no parseable target | N | null | null | null | at_risk |
| Unrecognized text | other | any | any | null | at_risk |

**Health thresholds for numeric progress_pct:**
- ≥ 90% → on_track
- 70–89% → at_risk
- < 70% → off_track

## Aggregation (Strategy / Goal / Overall)

```
aggregateHealth(statuses):
  - empty or all no_data → no_data
  - any off_track → off_track
  - any at_risk → at_risk
  - all on_track → on_track

progress_pct = avg(non-null child progress_pct values)
  - all null → null
```

## Plan Completion (per Strategy)

```
plan_completion_pct = round(sum(weights) / count × 100)
  weights: done=1, in_progress=0.5, not_started=0, delayed=0
  empty plans list → null
```

## Missing / Conflicting Data

- Missing actual: no_data, progress_pct=null
- Unparseable actual (not qualitative, not numeric): at_risk, progress_pct=null
- Actual exists but no arrow in profile text: at_risk, progress_pct=null
- Baseline equals target (no movement expected): treat as no_data
