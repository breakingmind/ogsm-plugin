# OGSM Execution Report — Alignment Diagnostics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Alignment Diagnostics layer (DOU-51, DOU-52, DOU-53) — adding a `diagnose.js` engine that detects structural gaps and broken references in the OGSM hierarchy, then surfaces them as Section 3 in the HTML report.

**Architecture:** New `scripts/ogsm-status/diagnose.js` accepts the same `{ profile, actuals, mpStatus, departments }` object that `buildViewModel` already uses and returns a flat `diagnostics[]` array of `{ type, severity, item_id, message }` items. `renderer.js` gains a Section 3 that renders errors and warnings from this array. `view-model.js` is updated to call `diagnose()` and pass the result into the view model's `meta`. No new npm dependencies.

**Tech Stack:** Node.js (vanilla, no npm deps), `node:assert` for smoke tests.

**Specs:** `docs/superpowers/specs/2026-05-19-ogsm-html-report-design.md` and the diagnostics rules doc written in Task 1.

**Annotation format constraint:** Goal-level annotations (goal_type, parent_ref) must be written **inline on the same line** as the goal number so that `parseNumberedList` in `parse-profile.js` captures them as part of the goal text string. Multi-line annotations below a goal line are silently dropped by the existing parser and must not be used in fixtures.

**Scope note:** Covers DOU-51, 52, 53 only. DOU-54–56 (Workflow Integration) requires a separate plan.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `docs/superpowers/specs/2026-05-19-ogsm-alignment-diagnostics-rules.md` | Create | DOU-51: written diagnostics rules spec |
| `examples/fixtures/ogsm-status/profile-gap.md` | Create | Company profile with structural gaps for testing |
| `examples/fixtures/ogsm-status/dept-profile-sales.md` | Create | Dept profile with inline goal_type/parent_ref annotations |
| `scripts/ogsm-status/diagnose.js` | Create | DOU-52: alignment graph + diagnostics engine |
| `scripts/ogsm-status/view-model.js` | Modify | Pass `diagnostics[]` into `vm.meta` |
| `scripts/ogsm-status/renderer.js` | Modify | DOU-53: Section 3 — Alignment Diagnostics |
| `scripts/test-scripts.sh` | Modify | Add diagnose.js smoke test |

---

## Task 1: Write alignment diagnostics rules spec (DOU-51)

**Files:**
- Create: `docs/superpowers/specs/2026-05-19-ogsm-alignment-diagnostics-rules.md`

- [ ] **Step 1: Write the spec document**

  Create `docs/superpowers/specs/2026-05-19-ogsm-alignment-diagnostics-rules.md`:

  ```markdown
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
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add docs/superpowers/specs/2026-05-19-ogsm-alignment-diagnostics-rules.md
  git commit -m "docs: add OGSM alignment diagnostics rules spec — DOU-51"
  ```

---

## Task 2: Create test fixtures

**Files:**
- Create: `examples/fixtures/ogsm-status/profile-gap.md`
- Create: `examples/fixtures/ogsm-status/dept-profile-sales.md`

These fixtures are referenced only by `diagnose.js` self-tests. The existing
`profile-minimal.md` is not modified.

- [ ] **Step 1: Create the gap company profile**

  Create `examples/fixtures/ogsm-status/profile-gap.md`:

  ```markdown
  ---
  scope: company
  slug: gap-corp
  parent: null
  owner_unit: management
  time_horizon: 2026 Q1
  last_confirmed: 2026-01-01
  ---

  # OGSM Profile: Gap Corp

  ## Objective

  Test diagnostics by exposing structural gaps.

  ## Goals

  1. Grow revenue.
  2. Reduce churn.
  3. Expand partnerships.

  ## Strategies

  1. Through digital sales, expand reach.
  2. Through support improvements, retain clients.
  3. Through partner programme, grow ecosystem.

  ## MD

  1. Monthly revenue: 100 → 120, 2026-03-31, monthly, validates S1.

  ## MP

  ## Review Cadence

  Monthly.
  ```

  Expected diagnostics from this profile (no actuals):
  - `strategy_no_md` warning for S2 (no measures[1])
  - `strategy_no_md` warning for S3 (no measures[2])
  - `md_no_evidence` warning for MD1 (no actual)
  - `no_plans` warning (empty MP section)

- [ ] **Step 2: Create the sales dept profile**

  Create `examples/fixtures/ogsm-status/dept-profile-sales.md`:

  ```markdown
  ---
  scope: department
  slug: sales
  name: Sales
  parent: company/example-corp
  ---

  # OGSM Profile: Sales Department

  ## Objective

  Win more new clients and build team capability.

  ## Goals

  1. Grow new-client close rate from 20% to 35% by 2026-03-31. <!-- goal_type: aligned | parent_ref: company-G1 -->
  2. Complete CRM training for all reps by 2026-02-28. <!-- goal_type: enabling | supports: [sales] -->

  ## Strategies

  1. Through targeted outreach cadence, build pipeline.
  2. Through structured training programme, build skills.

  ## MD

  1. Close rate: 20 → 35, 2026-03-31, monthly, validates S1.
  2. Training completion: 0 → 100, 2026-02-28, monthly, validates S2.

  ## MP

  1. owner: Carol, 2026-01-15, run weekly outreach sessions.

  ## Review Cadence

  Weekly.
  ```

  Expected diagnostics from this dept profile against `profile-minimal.md` (2 goals):
  - No errors (parent_ref: company-G1 → company has G1 ✓)
  - No missing_goal_type warnings (both goals have inline annotations)

- [ ] **Step 3: Commit**

  ```bash
  git add examples/fixtures/ogsm-status/profile-gap.md \
          examples/fixtures/ogsm-status/dept-profile-sales.md
  git commit -m "test(ogsm-status): add gap and dept fixtures for diagnostics — DOU-52"
  ```

---

## Task 3: Implement diagnose.js (DOU-52)

**Files:**
- Create: `scripts/ogsm-status/diagnose.js`

`parseArrow` is already exported from `compute.js`. The `profile` object from
`parse-profile.js` has: `{ meta, objective, goals[], strategies[], measures[], plans[] }`.
Department profiles have the same shape; their `goals[]` strings contain inline
HTML comment annotations.

- [ ] **Step 1: Write stub + failing tests**

  Create `scripts/ogsm-status/diagnose.js`:

  ```js
  'use strict';
  const { parseArrow } = require('./compute');

  const ANNOT_RE = /<!--\s*goal_type:\s*(\w+)(?:[^>]*\|\s*parent_ref:\s*([\w-]+))?/i;

  function parseGoalAnnotation(goalText) {
    const m = String(goalText || '').match(ANNOT_RE);
    if (!m) return { goal_type: null, parent_ref: null };
    return { goal_type: m[1] || null, parent_ref: m[2] || null };
  }

  function diagnose({ profile, actuals, mpStatus, departments }) {
    return [];
  }

  if (require.main === module) {
    const assert = require('assert');
    const path = require('path');
    const fs = require('fs');
    const { parseProfile } = require('./parse-profile');

    const fixtureDir = path.join(__dirname, '../../examples/fixtures/ogsm-status');
    const gapProfile = parseProfile(fs.readFileSync(path.join(fixtureDir, 'profile-gap.md'), 'utf8'));
    const minimalProfile = parseProfile(fs.readFileSync(path.join(fixtureDir, 'profile-minimal.md'), 'utf8'));
    const salesProfile = parseProfile(fs.readFileSync(path.join(fixtureDir, 'dept-profile-sales.md'), 'utf8'));

    // parseGoalAnnotation
    const ann1 = parseGoalAnnotation('Grow rate. <!-- goal_type: aligned | parent_ref: company-G1 -->');
    assert.strictEqual(ann1.goal_type, 'aligned', 'parseGoalAnnotation goal_type');
    assert.strictEqual(ann1.parent_ref, 'company-G1', 'parseGoalAnnotation parent_ref');

    const ann2 = parseGoalAnnotation('Plain goal text with no annotation.');
    assert.strictEqual(ann2.goal_type, null, 'no annotation → null goal_type');
    assert.strictEqual(ann2.parent_ref, null, 'no annotation → null parent_ref');

    // gap profile: strategy_no_md for S2, S3
    const d1 = diagnose({ profile: gapProfile, actuals: {}, mpStatus: {}, departments: [] });
    const types1 = d1.map(x => x.type);
    assert.ok(types1.filter(t => t === 'strategy_no_md').length === 2, 'S2 and S3 get strategy_no_md');
    assert.ok(types1.includes('md_no_evidence'), 'MD1 with no actual → md_no_evidence');
    assert.ok(types1.includes('no_plans'), 'empty plans → no_plans');

    // gap profile: S2/S3 have no md_no_evidence (there is no MD to have evidence for)
    const noMdItems = d1.filter(x => x.type === 'strategy_no_md');
    assert.ok(noMdItems.some(x => x.item_id === 'S2'), 'S2 reported');
    assert.ok(noMdItems.some(x => x.item_id === 'S3'), 'S3 reported');

    // gap profile: md_no_target — MD1 has arrow so should NOT appear
    assert.ok(!types1.includes('md_no_target'), 'MD1 has arrow — no md_no_target');

    // minimal profile with actuals: no warnings
    const d2 = diagnose({ profile: minimalProfile, actuals: { MD1: '105', MD2: '4.5' }, mpStatus: {}, departments: [] });
    const types2 = d2.map(x => x.type);
    assert.ok(!types2.includes('strategy_no_md'), 'minimal profile: no strategy_no_md');
    assert.ok(!types2.includes('md_no_evidence'), 'with actuals: no md_no_evidence');

    // dept profile: no broken_parent_ref (company has G1)
    const d3 = diagnose({
      profile: minimalProfile,
      actuals: { MD1: '105', MD2: '4.5' },
      mpStatus: {},
      departments: [salesProfile],
    });
    const errors3 = d3.filter(x => x.severity === 'error');
    assert.strictEqual(errors3.length, 0, 'valid parent_ref → no errors');

    // broken_parent_ref: dept goal references company-G5 (company only has 2 goals)
    const brokenDeptProfile = {
      meta: { slug: 'ops', name: 'Ops', parent: 'company/example-corp' },
      goals: ['Do something. <!-- goal_type: aligned | parent_ref: company-G5 -->'],
      strategies: [], measures: [], plans: [],
    };
    const d4 = diagnose({ profile: minimalProfile, actuals: {}, mpStatus: {}, departments: [brokenDeptProfile] });
    const broken = d4.filter(x => x.type === 'broken_parent_ref');
    assert.strictEqual(broken.length, 1, 'broken parent_ref detected');
    assert.strictEqual(broken[0].severity, 'error', 'broken_parent_ref is error severity');
    assert.ok(broken[0].message.includes('company-G5'), 'message names bad ref');

    // missing_goal_type
    const unannotatedDept = {
      meta: { slug: 'hr', name: 'HR', parent: 'company/example-corp' },
      goals: ['Hire 5 engineers by Q2.'],
      strategies: [], measures: [], plans: [],
    };
    const d5 = diagnose({ profile: minimalProfile, actuals: {}, mpStatus: {}, departments: [unannotatedDept] });
    const missing = d5.filter(x => x.type === 'missing_goal_type');
    assert.strictEqual(missing.length, 1, 'missing goal_type detected');
    assert.strictEqual(missing[0].severity, 'warning', 'missing_goal_type is warning');

    // ordering: errors before warnings
    const d6 = diagnose({ profile: gapProfile, actuals: {}, mpStatus: {}, departments: [brokenDeptProfile] });
    const sevs6 = d6.map(x => x.severity);
    const firstWarningIdx = sevs6.indexOf('warning');
    const lastErrorIdx = sevs6.lastIndexOf('error');
    assert.ok(lastErrorIdx < firstWarningIdx || firstWarningIdx === -1, 'errors before warnings');

    console.log('diagnose: all assertions passed');
  }

  module.exports = { diagnose, parseGoalAnnotation };
  ```

- [ ] **Step 2: Run to verify it fails**

  ```bash
  node scripts/ogsm-status/diagnose.js
  ```

  Expected: `AssertionError` on `S2 and S3 get strategy_no_md`.

- [ ] **Step 3: Implement diagnose()**

  Replace the stub `diagnose` function with the full implementation. Keep `parseGoalAnnotation`, the self-test block, and `module.exports` unchanged:

  ```js
  function diagnose({ profile, actuals, mpStatus, departments }) {
    const errors = [];
    const warnings = [];

    // --- Company profile diagnostics ---
    profile.goals.forEach((_goalText, gi) => {
      const stratId = `S${gi + 1}`;
      const mdId = `MD${gi + 1}`;
      const mdText = profile.measures[gi] || null;

      if (!mdText) {
        warnings.push({ type: 'strategy_no_md', severity: 'warning', item_id: stratId,
          message: `${stratId} has no corresponding measure (MD).` });
        return;
      }

      const { baseline, target } = parseArrow(mdText);
      if (baseline === null || target === null) {
        warnings.push({ type: 'md_no_target', severity: 'warning', item_id: mdId,
          message: `${mdId} has no parseable baseline → target arrow.` });
      }

      const actual = (actuals && actuals[mdId] !== undefined) ? actuals[mdId] : null;
      if (actual === null) {
        warnings.push({ type: 'md_no_evidence', severity: 'warning', item_id: mdId,
          message: `${mdId} has no actual value recorded.` });
      }
    });

    if (!profile.plans || profile.plans.length === 0) {
      warnings.push({ type: 'no_plans', severity: 'warning', item_id: 'MP',
        message: 'Profile has no plans (MP) defined.' });
    }

    // --- Department diagnostics ---
    const companyGoalCount = profile.goals.length;
    (departments || []).forEach(dept => {
      const slug = (dept.meta && dept.meta.slug) || 'unknown';
      (dept.goals || []).forEach((goalText, gi) => {
        const itemId = `${slug}-G${gi + 1}`;
        const { goal_type, parent_ref } = parseGoalAnnotation(goalText);

        if (!goal_type) {
          warnings.push({ type: 'missing_goal_type', severity: 'warning', item_id: itemId,
            message: `${itemId}: no goal_type annotation found.` });
        }

        if (parent_ref) {
          const refMatch = parent_ref.match(/[Gg](\d+)$/);
          if (refMatch) {
            const refN = parseInt(refMatch[1], 10);
            if (refN > companyGoalCount) {
              errors.push({ type: 'broken_parent_ref', severity: 'error', item_id: itemId,
                message: `${itemId}: parent_ref "${parent_ref}" references company-G${refN} which does not exist (company has ${companyGoalCount} goals).` });
            }
          }
        }
      });
    });

    errors.sort((a, b) => a.item_id < b.item_id ? -1 : a.item_id > b.item_id ? 1 : 0);
    warnings.sort((a, b) => a.item_id < b.item_id ? -1 : a.item_id > b.item_id ? 1 : 0);
    return [...errors, ...warnings];
  }
  ```

- [ ] **Step 4: Run to verify it passes**

  ```bash
  node scripts/ogsm-status/diagnose.js
  ```

  Expected: `diagnose: all assertions passed`

- [ ] **Step 5: Commit**

  ```bash
  git add scripts/ogsm-status/diagnose.js \
          examples/fixtures/ogsm-status/profile-gap.md \
          examples/fixtures/ogsm-status/dept-profile-sales.md
  git commit -m "feat(ogsm-status): add alignment diagnostics engine — DOU-52"
  ```

---

## Task 4: Wire diagnostics into view-model.js

**Files:**
- Modify: `scripts/ogsm-status/view-model.js`

Add `diagnose` import and pass `diagnostics[]` into `vm.meta`. No existing logic
changes — this is an additive change only.

- [ ] **Step 1: Add failing assertion to view-model self-test**

  In `view-model.js`, find `console.log('view-model: all assertions passed');` and add this assertion BEFORE it:

  ```js
  // diagnostics wired into meta
  assert.ok(Array.isArray(vm1.meta.diagnostics), 'meta.diagnostics is array');
  ```

- [ ] **Step 2: Run to verify it fails**

  ```bash
  node scripts/ogsm-status/view-model.js
  ```

  Expected: `AssertionError` on `meta.diagnostics is array`.

- [ ] **Step 3: Add diagnose import and wire into buildViewModel**

  At the top of `view-model.js`, after the `compute` require line, add:

  ```js
  const { diagnose } = require('./diagnose');
  ```

  In `buildViewModel`, replace the final `return { meta: {...}, objective, goals }` with:

  ```js
  const diagnostics = diagnose({ profile, actuals, mpStatus, departments });

  return {
    meta: {
      scope: profile.meta.scope || 'company',
      slug: profile.meta.slug || 'unknown',
      period: sources.period || profile.meta.time_horizon || 'unknown',
      generated_at: new Date().toISOString().slice(0, 10),
      health: overallHealth,
      diagnostics,
    },
    objective: { text: profile.objective || '' },
    goals,
  };
  ```

- [ ] **Step 4: Run view-model tests**

  ```bash
  node scripts/ogsm-status/view-model.js
  ```

  Expected: `view-model: all assertions passed`

- [ ] **Step 5: Verify renderer still passes**

  ```bash
  node scripts/ogsm-status/renderer.js
  ```

  Expected: `renderer: all assertions passed`

- [ ] **Step 6: Commit**

  ```bash
  git add scripts/ogsm-status/view-model.js
  git commit -m "feat(ogsm-status): wire diagnostics into view-model meta — DOU-52"
  ```

---

## Task 5: Add Section 3 to renderer.js (DOU-53)

**Files:**
- Modify: `scripts/ogsm-status/renderer.js`

Section 3 renders errors (🔴) and warnings (🟡) from `vm.meta.diagnostics`. If no
diagnostics exist, show a "✅ No issues found." note. The section is appended after
Section 2.

- [ ] **Step 1: Add failing DOU-53 assertions to renderer self-test**

  In `renderer.js`, find `console.log('renderer: all assertions passed');` and add these BEFORE it:

  ```js
  // DOU-53: Section 3 diagnostics
  const { diagnose: diag53 } = require('./diagnose');
  const { parseProfile: pp53 } = require('./parse-profile');
  const fs53 = require('fs');
  const gapProf = pp53(fs53.readFileSync(
    path.join(__dirname, '../../examples/fixtures/ogsm-status/profile-gap.md'), 'utf8'
  ));
  const vm53 = buildViewModel({ profile: gapProf, actuals: {}, mpStatus: {}, departments: [] });
  const html53 = render(vm53);
  assert.ok(html53.includes('Section 3'), 'has Section 3');
  assert.ok(html53.includes('strategy_no_md') || html53.includes('S2'), 'shows strategy_no_md');
  assert.ok(html53.includes('no_plans') || html53.includes('No plans'), 'shows no_plans');

  // clean profile: shows no-issues note
  const vmClean = buildViewModel({ profile, actuals: { MD1: '105', MD2: '4.5' }, mpStatus: {}, departments: [] });
  const htmlClean = render(vmClean);
  assert.ok(htmlClean.includes('Section 3'), 'clean profile also has Section 3');
  assert.ok(htmlClean.includes('No issues') || htmlClean.includes('no issues'), 'clean profile shows no issues');
  ```

- [ ] **Step 2: Run to verify the new assertions fail**

  ```bash
  node scripts/ogsm-status/renderer.js
  ```

  Expected: `AssertionError` on `has Section 3`.

- [ ] **Step 3: Add Section 3 CSS**

  In the `CSS` constant, after the `.no-evidence-list` rule, add:

  ```css
  .diag-error-list{margin:8px 0;padding-left:20px;font-size:.9em;color:#991b1b}
  .diag-warn-list{margin:8px 0;padding-left:20px;font-size:.9em;color:#92400e}
  .diag-type{font-weight:600;font-family:monospace;font-size:.85em}
  .diag-ok{color:#166534;font-size:.9em;font-style:italic}
  ```

- [ ] **Step 4: Add renderSection3 function**

  Add immediately before the `render` function:

  ```js
  function renderSection3(vm) {
    const diags = (vm.meta.diagnostics || []);
    const errors = diags.filter(d => d.severity === 'error');
    const warnings = diags.filter(d => d.severity === 'warning');

    if (!diags.length) {
      return `<div class="section-title">Section 3: Alignment Diagnostics</div>
        <p class="diag-ok">✅ No issues found.</p>`;
    }

    const errorHtml = errors.length
      ? `<p style="font-weight:500;margin:12px 0 6px;color:#991b1b">🔴 Issues Requiring Action</p>
         <ul class="diag-error-list">${errors.map(d =>
           `<li><span class="diag-type">${esc(d.type)}</span> [${esc(d.item_id)}]: ${esc(d.message)}</li>`
         ).join('')}</ul>`
      : '';

    const warnHtml = warnings.length
      ? `<p style="font-weight:500;margin:12px 0 6px;color:#92400e">🟡 Warnings</p>
         <ul class="diag-warn-list">${warnings.map(d =>
           `<li><span class="diag-type">${esc(d.type)}</span> [${esc(d.item_id)}]: ${esc(d.message)}</li>`
         ).join('')}</ul>`
      : '';

    return `<div class="section-title">Section 3: Alignment Diagnostics</div>
      ${errorHtml}
      ${warnHtml}`;
  }
  ```

- [ ] **Step 5: Call renderSection3 in render()**

  In the `render` function, replace:

  ```js
  ${renderSection2(vm)}
  <footer>
  ```

  with:

  ```js
  ${renderSection2(vm)}
  ${renderSection3(vm)}
  <footer>
  ```

- [ ] **Step 6: Run to verify all assertions pass**

  ```bash
  node scripts/ogsm-status/renderer.js
  ```

  Expected: `renderer: all assertions passed`

- [ ] **Step 7: Verify HTML output visually**

  ```bash
  node -e "
  const {parseProfile}=require('./scripts/ogsm-status/parse-profile');
  const {buildViewModel}=require('./scripts/ogsm-status/view-model');
  const {render}=require('./scripts/ogsm-status/renderer');
  const fs=require('fs');
  const profile=parseProfile(fs.readFileSync('examples/fixtures/ogsm-status/profile-gap.md','utf8'));
  const vm=buildViewModel({profile,actuals:{},mpStatus:{},departments:[]});
  fs.writeFileSync('/tmp/ogsm-report-plan3.html',render(vm));
  console.log('Written to /tmp/ogsm-report-plan3.html');
  "
  ```

  Verify: Section 3 visible with S2/S3 warnings, no_plans warning, no_evidence warning.

- [ ] **Step 8: Commit**

  ```bash
  git add scripts/ogsm-status/renderer.js
  git commit -m "feat(ogsm-status): add Section 3 alignment diagnostics — DOU-53"
  ```

---

## Task 6: Add diagnose.js smoke test and run full suite

**Files:**
- Modify: `scripts/test-scripts.sh`

- [ ] **Step 1: Add diagnose smoke test after the view-model test line**

  In `scripts/test-scripts.sh`, find:

  ```sh
  # ogsm-status: view-model smoke test
  node "$script_dir/ogsm-status/view-model.js"
  ```

  Add immediately after:

  ```sh
  # ogsm-status: diagnose smoke test
  node "$script_dir/ogsm-status/diagnose.js"
  ```

- [ ] **Step 2: Run the full test suite**

  ```bash
  scripts/test-scripts.sh
  ```

  Expected: all tests pass including the new diagnose smoke test.

- [ ] **Step 3: Commit**

  ```bash
  git add scripts/test-scripts.sh
  git commit -m "test(ogsm-status): add diagnose smoke test — DOU-52"
  ```

---

## Task 7: Update Linear DOU-51/52/53 to Done

- [ ] Mark **DOU-51** as Done in Linear
- [ ] Mark **DOU-52** as Done in Linear
- [ ] Mark **DOU-53** as Done in Linear

---

## Done Definition Checklist

- [ ] `scripts/test-scripts.sh` passes end-to-end
- [ ] Gap profile produces `strategy_no_md` (S2, S3), `md_no_evidence` (MD1), `no_plans`
- [ ] Broken `parent_ref` produces `error` severity diagnostic
- [ ] Missing goal_type annotation produces `warning` severity diagnostic
- [ ] Valid dept profile with correct `parent_ref` produces no errors
- [ ] Section 3 renders errors before warnings
- [ ] Section 3 shows "No issues found" when diagnostics array is empty
- [ ] All existing renderer/view-model tests still pass
- [ ] All three Linear issues marked Done
