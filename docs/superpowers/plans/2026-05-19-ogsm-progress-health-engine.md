# OGSM Execution Report — Progress & Health Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Progress & Health Engine (DOU-48, DOU-49, DOU-50) — replacing the MVP `at_risk` placeholder with a real computation engine that derives health status and progress percentages from MD target/actual comparisons, then surfaces the results in the HTML report.

**Architecture:** New `scripts/ogsm-status/compute.js` provides pure computation functions (`parseArrow`, `computeMdStatus`, `aggregateHealth`, `avgPct`, `computePlanCompletionPct`). `view-model.js` imports these to replace the two MVP placeholder functions. `renderer.js` gains progress bars per goal, a "Plan Completion %" per strategy, a Delayed-MP list, and a No-Evidence-MD list (DOU-50). No new npm dependencies.

**Tech Stack:** Node.js (vanilla, no npm deps), `node:assert` for smoke tests.

**Specs:** `docs/superpowers/specs/2026-05-19-ogsm-html-report-design.md` and the scoring rules doc written in Task 1.

**Scope note:** Covers DOU-48, 49, 50 only. DOU-51–53 (Alignment Diagnostics) and DOU-54–56 (Workflow Integration) each require a separate plan.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `docs/superpowers/specs/2026-05-19-ogsm-health-scoring-rules.md` | Create | DOU-48: written scoring & health rules spec |
| `scripts/ogsm-status/compute.js` | Create | DOU-49: pure computation functions |
| `scripts/ogsm-status/view-model.js` | Modify | Replace MVP placeholder with compute engine |
| `scripts/ogsm-status/renderer.js` | Modify | DOU-50: progress bars, delayed/no-evidence sections |
| `scripts/test-scripts.sh` | Modify | Add compute.js smoke test |

---

## Task 1: Write scoring rules spec (DOU-48)

**Files:**
- Create: `docs/superpowers/specs/2026-05-19-ogsm-health-scoring-rules.md`

- [ ] **Step 1: Write the spec document**

  Create `docs/superpowers/specs/2026-05-19-ogsm-health-scoring-rules.md`:

  ```markdown
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
  - Baseline equals target (no movement): treat as no_data
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add -f docs/superpowers/specs/2026-05-19-ogsm-health-scoring-rules.md
  git commit -m "docs: add OGSM health scoring rules spec — DOU-48"
  ```

---

## Task 2: Implement compute.js (DOU-49)

**Files:**
- Create: `scripts/ogsm-status/compute.js`

Context: The fixture profile (`examples/fixtures/ogsm-status/profile-minimal.md`) has:
- MD1: `Monthly revenue: 100 → 120, 2026-03-31, monthly, validates S1.` (increase target)
- MD2: `Avg delivery days: 5 → 3, 2026-03-31, monthly, validates S2.` (decrease target)

Review fixture has: `<!-- md-actual: MD1=105, MD2=4.5 -->`
- MD1 actual=105, target=120: 105/120=0.875 → 88% → at_risk
- MD2 actual=4.5, target=3: 3/4.5=0.667 → 67% → off_track

- [ ] **Step 1: Write stub + failing tests**

  Create `scripts/ogsm-status/compute.js`:

  ```js
  'use strict';

  function parseArrow(mdText) { return { baseline: null, target: null }; }
  function computeMdStatus(actual, baseline, target) { return { status: 'no_data', progress_pct: null }; }
  function aggregateHealth(statuses) { return 'no_data'; }
  function avgPct(pcts) { return null; }
  function computePlanCompletionPct(plans) { return null; }

  if (require.main === module) {
    const assert = require('assert');

    // parseArrow
    const a1 = parseArrow('Monthly revenue: 100 → 120, 2026-03-31');
    assert.strictEqual(a1.baseline, 100, 'parseArrow baseline');
    assert.strictEqual(a1.target, 120, 'parseArrow target');

    const a2 = parseArrow('Avg delivery days: 5 → 3');
    assert.strictEqual(a2.baseline, 5, 'parseArrow decrease baseline');
    assert.strictEqual(a2.target, 3, 'parseArrow decrease target');

    const a3 = parseArrow('No arrow here');
    assert.strictEqual(a3.baseline, null, 'parseArrow no arrow → null baseline');
    assert.strictEqual(a3.target, null, 'parseArrow no arrow → null target');

    // computeMdStatus — no actual
    const r1 = computeMdStatus(null, 100, 120);
    assert.strictEqual(r1.status, 'no_data', 'null actual → no_data');
    assert.strictEqual(r1.progress_pct, null, 'null actual → null pct');

    // qualitative done
    const r2 = computeMdStatus('完成', null, null);
    assert.strictEqual(r2.status, 'on_track', 'done text → on_track');
    assert.strictEqual(r2.progress_pct, 100, 'done text → 100%');

    // numeric increase, at_risk (105/120=88%)
    const r3 = computeMdStatus('105', 100, 120);
    assert.strictEqual(r3.status, 'at_risk', '105/120=88% → at_risk');
    assert.strictEqual(r3.progress_pct, 88, '105/120 rounds to 88');

    // numeric increase, on_track (110/120=92%)
    const r4 = computeMdStatus('110', 100, 120);
    assert.strictEqual(r4.status, 'on_track', '110/120=92% → on_track');
    assert.strictEqual(r4.progress_pct, 92, '110/120 rounds to 92');

    // numeric decrease, off_track (3/4.5=67%)
    const r5 = computeMdStatus('4.5', 5, 3);
    assert.strictEqual(r5.status, 'off_track', '3/4.5=67% → off_track');
    assert.strictEqual(r5.progress_pct, 67, '3/4.5 rounds to 67');

    // numeric, no target → at_risk
    const r6 = computeMdStatus('105', null, null);
    assert.strictEqual(r6.status, 'at_risk', 'numeric but no target → at_risk');
    assert.strictEqual(r6.progress_pct, null, 'no target → null pct');

    // aggregateHealth
    assert.strictEqual(aggregateHealth([]), 'no_data', 'empty → no_data');
    assert.strictEqual(aggregateHealth(['no_data', 'no_data']), 'no_data', 'all no_data → no_data');
    assert.strictEqual(aggregateHealth(['on_track', 'at_risk']), 'at_risk', 'any at_risk → at_risk');
    assert.strictEqual(aggregateHealth(['at_risk', 'off_track']), 'off_track', 'any off_track → off_track');
    assert.strictEqual(aggregateHealth(['on_track', 'on_track']), 'on_track', 'all on_track → on_track');

    // avgPct
    assert.strictEqual(avgPct([]), null, 'empty → null');
    assert.strictEqual(avgPct([null, null]), null, 'all null → null');
    assert.strictEqual(avgPct([80, null, 100]), 90, 'avg(80,100)=90');
    assert.strictEqual(avgPct([88, 67]), 78, 'avg(88,67)=77.5→78');

    // computePlanCompletionPct
    assert.strictEqual(computePlanCompletionPct([]), null, 'empty plans → null');
    const plans1 = [
      { status: 'done' }, { status: 'in_progress' },
      { status: 'not_started' }, { status: 'delayed' },
    ];
    // (1 + 0.5 + 0 + 0) / 4 * 100 = 37.5 → 38
    assert.strictEqual(computePlanCompletionPct(plans1), 38, '(1+0.5)/4=37.5→38');

    console.log('compute: all assertions passed');
  }

  module.exports = { parseArrow, computeMdStatus, aggregateHealth, avgPct, computePlanCompletionPct };
  ```

- [ ] **Step 2: Run to verify it fails**

  ```bash
  node scripts/ogsm-status/compute.js
  ```

  Expected: `AssertionError` on `parseArrow baseline`.

- [ ] **Step 3: Implement all functions**

  Replace the five stub functions with the full implementations. Keep the self-test block and `module.exports` unchanged:

  ```js
  'use strict';

  const ARROW_RE = /(\d+(?:\.\d+)?)\s*[→->]\s*(\d+(?:\.\d+)?)/;
  const QUAL_DONE_RE = /^(完成|done|completed|✅)$/i;
  const QUAL_PROGRESS_RE = /^(進行中|in[_\- ]?progress|🔄)$/i;
  const QUAL_NOT_STARTED_RE = /^(未開始|not[_\- ]?started|⬜)$/i;

  function parseArrow(mdText) {
    const m = String(mdText || '').match(ARROW_RE);
    if (!m) return { baseline: null, target: null };
    return { baseline: parseFloat(m[1]), target: parseFloat(m[2]) };
  }

  function computeMdStatus(actual, baseline, target) {
    if (actual === null) return { status: 'no_data', progress_pct: null };

    const trimmed = String(actual).trim();

    if (QUAL_DONE_RE.test(trimmed)) return { status: 'on_track', progress_pct: 100 };
    if (QUAL_PROGRESS_RE.test(trimmed)) return { status: 'at_risk', progress_pct: 50 };
    if (QUAL_NOT_STARTED_RE.test(trimmed)) return { status: 'off_track', progress_pct: 0 };

    const actualNum = parseFloat(trimmed);
    if (isNaN(actualNum)) return { status: 'at_risk', progress_pct: null };

    if (baseline !== null && target !== null && target !== baseline) {
      let pct;
      if (target > baseline) {
        pct = Math.min(100, Math.round((actualNum / target) * 100));
      } else {
        pct = actualNum <= 0 ? 0 : Math.min(100, Math.round((target / actualNum) * 100));
      }
      const status = pct >= 90 ? 'on_track' : pct >= 70 ? 'at_risk' : 'off_track';
      return { status, progress_pct: pct };
    }

    return { status: 'at_risk', progress_pct: null };
  }

  function aggregateHealth(statuses) {
    if (!statuses.length || statuses.every(s => s === 'no_data')) return 'no_data';
    if (statuses.some(s => s === 'off_track')) return 'off_track';
    if (statuses.some(s => s === 'at_risk')) return 'at_risk';
    return 'on_track';
  }

  function avgPct(pcts) {
    const valid = pcts.filter(p => p !== null);
    if (!valid.length) return null;
    return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
  }

  function computePlanCompletionPct(plans) {
    if (!plans.length) return null;
    const WEIGHTS = { done: 1, in_progress: 0.5, not_started: 0, delayed: 0 };
    const sum = plans.reduce((acc, p) => acc + (WEIGHTS[p.status] || 0), 0);
    return Math.round((sum / plans.length) * 100);
  }
  ```

- [ ] **Step 4: Run to verify it passes**

  ```bash
  node scripts/ogsm-status/compute.js
  ```

  Expected: `compute: all assertions passed`

- [ ] **Step 5: Commit**

  ```bash
  git add scripts/ogsm-status/compute.js
  git commit -m "feat(ogsm-status): add compute engine — DOU-49"
  ```

---

## Task 3: Wire compute engine into view-model.js

**Files:**
- Modify: `scripts/ogsm-status/view-model.js`

Replace the file completely. The MVP `mdStatus` / `healthFromStatuses` functions are removed; `compute.js` replaces them. New fields added: `progress_pct` per measure, `plan_completion_pct` per strategy.

- [ ] **Step 1: Overwrite view-model.js with new implementation + updated tests**

  ```js
  'use strict';
  const { parseArrow, computeMdStatus, aggregateHealth, avgPct, computePlanCompletionPct } = require('./compute');

  function parseOwner(mpText) {
    const m = mpText.match(/owner:\s*([^,，]+)/i);
    return m ? m[1].trim() : null;
  }

  function lookupActual(actuals, id) {
    if (!actuals) return null;
    return actuals[id] !== undefined ? actuals[id] : null;
  }

  function buildViewModel(sources) {
    const { profile, actuals, mpStatus, departments } = sources;

    const goals = profile.goals.map((goalText, gi) => {
      const goalId = `G${gi + 1}`;
      const stratText = profile.strategies[gi] || '';
      const stratId = `S${gi + 1}`;

      const mdText = profile.measures[gi] || null;
      const mdId = `MD${gi + 1}`;
      const actual = lookupActual(actuals, mdId);

      let mdItem = [];
      if (mdText) {
        const { baseline, target } = parseArrow(mdText);
        const { status, progress_pct } = computeMdStatus(actual, baseline, target);
        mdItem = [{
          id: mdId,
          text: mdText,
          baseline: baseline !== null ? String(baseline) : null,
          target: target !== null ? String(target) : null,
          actual,
          status,
          progress_pct,
        }];
      }

      const plans = profile.plans.map((mpText, pi) => {
        const mpId = `MP${pi + 1}`;
        return {
          id: mpId,
          text: mpText,
          owner: parseOwner(mpText),
          status: (mpStatus && mpStatus[mpId]) || 'not_started',
        };
      });

      const depts = (departments || []).filter(d => {
        const ref = (d.meta && d.meta.parent_ref) || null;
        return ref === stratId || ref === `company-${stratId}`;
      }).map(d => ({
        slug: d.meta.slug || 'unknown',
        name: d.meta.name || d.meta.slug || 'unknown',
        measures: [],
        plans: [],
      }));

      const mdStatuses = mdItem.map(m => m.status);
      const mdPcts = mdItem.map(m => m.progress_pct);
      const stratHealth = aggregateHealth(mdStatuses);
      const stratProgressPct = avgPct(mdPcts);
      const planCompletionPct = computePlanCompletionPct(plans);

      const strat = {
        id: stratId,
        text: stratText,
        measures: mdItem,
        plans,
        departments: depts,
        plan_completion_pct: planCompletionPct,
      };

      return {
        id: goalId,
        text: goalText,
        health: aggregateHealth([stratHealth]),
        progress_pct: stratProgressPct,
        strategies: [strat],
      };
    });

    const overallHealth = aggregateHealth(goals.map(g => g.health));

    return {
      meta: {
        scope: profile.meta.scope || 'company',
        slug: profile.meta.slug || 'unknown',
        period: sources.period || profile.meta.time_horizon || 'unknown',
        generated_at: new Date().toISOString().slice(0, 10),
        health: overallHealth,
      },
      objective: { text: profile.objective || '' },
      goals,
    };
  }

  if (require.main === module) {
    const assert = require('assert');
    const { parseProfile } = require('./parse-profile');
    const fs = require('fs');
    const path = require('path');

    const profileText = fs.readFileSync(
      path.join(__dirname, '../../examples/fixtures/ogsm-status/profile-minimal.md'), 'utf8'
    );
    const profile = parseProfile(profileText);

    // Test 1: no actuals → no_data health
    const vm1 = buildViewModel({ profile, actuals: {}, mpStatus: {}, departments: [] });
    assert.ok(vm1, 'buildViewModel returns a value');
    assert.strictEqual(vm1.meta.slug, 'example-corp');
    assert.strictEqual(vm1.meta.health, 'no_data');
    assert.strictEqual(vm1.goals.length, 2);
    assert.strictEqual(vm1.goals[0].health, 'no_data');
    assert.strictEqual(vm1.goals[0].progress_pct, null);
    assert.strictEqual(vm1.goals[0].strategies.length, 1);

    // Test 2: with actuals — MD1: 100→120, actual=105 → 88% at_risk
    //                        MD2: 5→3,   actual=4.5 → 67% off_track
    const vm2 = buildViewModel({ profile, actuals: { MD1: '105', MD2: '4.5' }, mpStatus: { MP1: 'done' }, departments: [] });
    assert.notStrictEqual(vm2.meta.health, 'no_data', 'health changes with actuals');
    assert.strictEqual(vm2.goals[0].strategies[0].measures[0].progress_pct, 88, 'MD1 progress_pct=88');
    assert.strictEqual(vm2.goals[0].strategies[0].measures[0].status, 'at_risk', 'MD1 at_risk');
    assert.strictEqual(vm2.goals[1].strategies[0].measures[0].progress_pct, 67, 'MD2 progress_pct=67');
    assert.strictEqual(vm2.goals[1].strategies[0].measures[0].status, 'off_track', 'MD2 off_track');
    assert.strictEqual(vm2.goals[0].strategies[0].plans[0].status, 'done', 'MP1 status done');

    // Test 3: generated_at format
    assert.match(vm1.meta.generated_at, /^\d{4}-\d{2}-\d{2}$/, 'generated_at format');

    // Test 4: plan_completion_pct — MP1=done(1), MP2=in_progress(0.5) → 75%
    const vm3 = buildViewModel({ profile, actuals: {}, mpStatus: { MP1: 'done', MP2: 'in_progress' }, departments: [] });
    assert.strictEqual(vm3.goals[0].strategies[0].plan_completion_pct, 75, 'plan_completion_pct=75');

    console.log('view-model: all assertions passed');
  }

  module.exports = { buildViewModel };
  ```

- [ ] **Step 2: Run view-model tests**

  ```bash
  node scripts/ogsm-status/view-model.js
  ```

  Expected: `view-model: all assertions passed`

- [ ] **Step 3: Verify renderer still passes**

  ```bash
  node scripts/ogsm-status/renderer.js
  ```

  Expected: `renderer: all assertions passed`

- [ ] **Step 4: Commit**

  ```bash
  git add scripts/ogsm-status/view-model.js
  git commit -m "feat(ogsm-status): wire compute engine into view-model — DOU-49"
  ```

---

## Task 4: Update renderer.js for DOU-50

**Files:**
- Modify: `scripts/ogsm-status/renderer.js`

DOU-50 requires: progress bars per goal, plan completion % per strategy, progress_pct column in MD table, delayed-MP list in Section 2, no-evidence-MD list in Section 2.

- [ ] **Step 1: Add failing DOU-50 assertions to the self-test block**

  In `scripts/ogsm-status/renderer.js`, find `console.log('renderer: all assertions passed');` and add these assertions BEFORE it:

  ```js
  // DOU-50: progress bars and delayed/no-evidence sections
  const { buildViewModel: bvm } = require('./view-model');
  const vm3 = bvm({
    profile,
    actuals: { MD1: '105', MD2: '4.5' },
    mpStatus: { MP1: 'delayed', MP2: 'not_started' },
    departments: [],
  });
  const html3 = render(vm3);
  assert.ok(html3.includes('88%'), 'shows MD1 progress_pct 88%');
  assert.ok(html3.includes('67%'), 'shows MD2 progress_pct 67%');
  assert.ok(html3.includes('Delayed') || html3.includes('delayed'), 'shows delayed section');
  assert.ok(html3.includes('Plan Completion'), 'shows plan completion label');
  ```

- [ ] **Step 2: Run to verify the new assertions fail**

  ```bash
  node scripts/ogsm-status/renderer.js
  ```

  Expected: `AssertionError` on `shows MD1 progress_pct 88%`.

- [ ] **Step 3: Update CSS — add progress bar and list styles**

  In the `CSS` constant, add these lines after `.no-data-note{...}`:

  ```css
  .progress-bar-wrap{background:#f3f4f6;border-radius:4px;height:8px;overflow:hidden;display:inline-block;width:120px;vertical-align:middle;margin:0 8px}
  .progress-bar{height:100%;border-radius:4px;background:#6366f1}
  .progress-bar.on_track{background:#16a34a}
  .progress-bar.at_risk{background:#d97706}
  .progress-bar.off_track{background:#dc2626}
  .delayed-list{margin:8px 0;padding-left:20px;font-size:.9em;color:#991b1b}
  .no-evidence-list{margin:8px 0;padding-left:20px;font-size:.9em;color:#9ca3af}
  ```

- [ ] **Step 4: Add `renderProgressBar` helper after `healthBadge`**

  Add immediately after the `healthBadge` function:

  ```js
  function renderProgressBar(pct, health) {
    if (pct === null || pct === undefined)
      return '<span class="health-no_data" style="font-size:.85em">—</span>';
    const cls = esc(health || 'no_data');
    return `<div class="progress-bar-wrap"><div class="progress-bar ${cls}" style="width:${esc(pct)}%"></div></div><span class="pct">${esc(pct)}%</span>`;
  }
  ```

- [ ] **Step 5: Update `renderMdTable` — add Progress column**

  Replace the existing `renderMdTable` function:

  ```js
  function renderMdTable(measures) {
    if (!measures.length) return '';
    const rows = measures.map(m => `<tr>
      <td>${esc(m.id)}</td>
      <td>${esc(m.text)}</td>
      <td>${m.actual !== null ? esc(m.actual) : '<span class="health-no_data">—</span>'}</td>
      <td>${m.progress_pct !== null && m.progress_pct !== undefined ? esc(m.progress_pct) + '%' : '—'}</td>
      <td>${healthBadge(m.status)}</td>
    </tr>`).join('');
    return `<table class="md-table">
      <thead><tr><th>ID</th><th>Measure</th><th>Actual</th><th>Progress</th><th>Status</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
  }
  ```

- [ ] **Step 6: Update `renderStrategy` — add plan completion line**

  Replace the existing `renderStrategy` function:

  ```js
  function renderStrategy(s) {
    const planPct = s.plan_completion_pct !== null && s.plan_completion_pct !== undefined
      ? `<div style="font-size:.85em;color:#6b7280;margin-top:4px">Plan Completion: ${esc(s.plan_completion_pct)}%</div>`
      : '';
    const depts = s.departments.map(d => `<details>
      <summary>Dept: ${esc(d.name)}</summary>
      <div class="dept"><strong>${esc(d.name)}</strong>${renderMdTable(d.measures)}</div>
    </details>`).join('');
    return `<div class="strategy">
      <span class="strategy-id">${esc(s.id)}</span>${esc(s.text)}
      ${renderMdTable(s.measures)}
      ${planPct}
      ${depts}
    </div>`;
  }
  ```

- [ ] **Step 7: Update `renderSection1` — use progress bar instead of raw pct span**

  Replace the goal row template in `renderSection1`:

  ```js
  function renderSection1(vm) {
    const goalRows = vm.goals.map(g => {
      return `<div class="goal-row">
        <span class="goal-id">${esc(g.id)}</span>
        <span class="goal-text">${esc(g.text)}</span>
        ${renderProgressBar(g.progress_pct, g.health)}
        ${healthBadge(g.health)}
      </div>
      ${g.strategies.map(renderStrategy).join('')}`;
    }).join('');

    return `<div class="section-title">Section 1: Where Are We?</div>
      <div class="objective">${esc(vm.objective.text)}</div>
      ${goalRows}`;
  }
  ```

- [ ] **Step 8: Update `renderSection2` — add delayed and no-evidence subsections**

  Replace the existing `renderSection2` function:

  ```js
  function renderSection2(vm) {
    const allPlans = vm.goals.flatMap(g => g.strategies.flatMap(s => s.plans));
    const allMeasures = vm.goals.flatMap(g => g.strategies.flatMap(s => s.measures));
    const withActuals = allMeasures.filter(m => m.actual !== null);
    const delayedPlans = allPlans.filter(p => p.status === 'delayed');
    const noEvidenceMds = allMeasures.filter(m => m.status === 'no_data');

    const mpCards = allPlans.length
      ? allPlans.map(p => `<div class="mp-card">
          <span class="mp-id">${esc(p.id)}</span>${PLAN_ICON[p.status] || '⬜'}
          ${p.owner ? `<span class="owner">${esc(p.owner)}</span>` : ''}
          <div class="mp-text">${esc(p.text.length > 80 ? p.text.slice(0, 80) + '…' : p.text)}</div>
        </div>`).join('')
      : '<p class="no-data-note">No plans defined.</p>';

    const actualItems = withActuals.length
      ? withActuals.map(m => {
          const pctStr = m.progress_pct !== null && m.progress_pct !== undefined
            ? ` (${esc(m.progress_pct)}%)` : '';
          return `<li><strong>${esc(m.id)}</strong>: ${esc(m.actual)}${pctStr}</li>`;
        }).join('')
      : '<li class="no-data-note">No actuals recorded yet.</li>';

    const delayedHtml = delayedPlans.length
      ? `<p style="font-weight:500;margin:16px 0 8px;color:#991b1b">❌ Delayed</p>
         <ul class="delayed-list">${delayedPlans.map(p =>
           `<li>${esc(p.id)}: ${esc(p.text.length > 60 ? p.text.slice(0, 60) + '…' : p.text)}</li>`
         ).join('')}</ul>`
      : '';

    const noEvidenceHtml = noEvidenceMds.length
      ? `<p style="font-weight:500;margin:16px 0 8px">⚪ No Evidence</p>
         <ul class="no-evidence-list">${noEvidenceMds.map(m =>
           `<li>${esc(m.id)}: ${esc(m.text.length > 60 ? m.text.slice(0, 60) + '…' : m.text)}</li>`
         ).join('')}</ul>`
      : '';

    return `<div class="section-title">Section 2: What Did We Do?</div>
      <p style="font-weight:500;margin:0 0 8px">MP Status this period</p>
      <div class="mp-grid">${mpCards}</div>
      <p style="font-weight:500;margin:16px 0 8px">MD Updates</p>
      <ul class="actuals-list">${actualItems}</ul>
      ${delayedHtml}
      ${noEvidenceHtml}`;
  }
  ```

- [ ] **Step 9: Run to verify all assertions pass**

  ```bash
  node scripts/ogsm-status/renderer.js
  ```

  Expected: `renderer: all assertions passed`

- [ ] **Step 10: Verify HTML output visually**

  ```bash
  node -e "
  const {parseProfile} = require('./scripts/ogsm-status/parse-profile');
  const {buildViewModel} = require('./scripts/ogsm-status/view-model');
  const {render} = require('./scripts/ogsm-status/renderer');
  const fs = require('fs');
  const profile = parseProfile(fs.readFileSync('examples/fixtures/ogsm-status/profile-minimal.md','utf8'));
  const vm = buildViewModel({profile, actuals:{MD1:'105',MD2:'4.5'}, mpStatus:{MP1:'done',MP2:'in_progress'}, departments:[]});
  fs.writeFileSync('/tmp/ogsm-report-plan2.html', render(vm));
  console.log('Written to /tmp/ogsm-report-plan2.html');
  "
  ```

  Verify: progress bars visible for goals, Plan Completion % in strategy blocks, progress_pct column in MD table.

- [ ] **Step 11: Commit**

  ```bash
  git add scripts/ogsm-status/renderer.js
  git commit -m "feat(ogsm-status): add progress bars and delayed/no-evidence sections — DOU-50"
  ```

---

## Task 5: Add compute.js smoke test and run full suite

**Files:**
- Modify: `scripts/test-scripts.sh`

- [ ] **Step 1: Add compute smoke test before the parse-profile test**

  In `scripts/test-scripts.sh`, find the line:

  ```sh
  # ogsm-status: parse-profile smoke test
  node "$script_dir/ogsm-status/parse-profile.js"
  ```

  Add a new block immediately before it:

  ```sh
  # ogsm-status: compute engine smoke test
  node "$script_dir/ogsm-status/compute.js"
  ```

- [ ] **Step 2: Run the full test suite**

  ```bash
  scripts/test-scripts.sh
  ```

  Expected: all tests pass including the new compute smoke test.

- [ ] **Step 3: Commit**

  ```bash
  git add scripts/test-scripts.sh
  git commit -m "test(ogsm-status): add compute smoke test — DOU-49"
  ```

---

## Task 6: Update Linear DOU-48/49/50 to Done

- [ ] Mark **DOU-48** as Done in Linear
- [ ] Mark **DOU-49** as Done in Linear
- [ ] Mark **DOU-50** as Done in Linear

---

## Done Definition Checklist

- [ ] `scripts/test-scripts.sh` passes end-to-end
- [ ] MD with numeric arrow target shows real progress_pct (not always 100)
- [ ] MD with no target shows `at_risk` + `null` progress_pct
- [ ] MD with no actual shows `no_data`
- [ ] Progress bars visible in Section 1 goal rows
- [ ] Plan Completion % visible in strategy blocks
- [ ] Delayed MPs listed in Section 2
- [ ] No-evidence MDs listed in Section 2
- [ ] All three Linear issues marked Done
