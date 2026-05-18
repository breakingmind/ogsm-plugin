# OGSM Execution Report — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Execution View Foundation for the OGSM HTML report (DOU-45, DOU-46, DOU-47) — producing a single self-contained HTML file from `.ogsm/` data that shows current status and what was done this period.

**Architecture:** Four modules in `scripts/ogsm-status/`: `parse-profile.js` (markdown → JS object), `view-model.js` (sources → unified view model, DOU-45), `loader.js` (.ogsm/ → sources, DOU-46), `renderer.js` (view model → HTML, DOU-47). Shell smoke tests added to `scripts/test-scripts.sh`. No new npm dependencies — vanilla Node.js only.

**Tech Stack:** Node.js (vanilla, no npm deps), HTML + inline CSS, native `<details>` for expand/collapse, `node:assert` for smoke tests.

**Spec:** `docs/superpowers/specs/2026-05-19-ogsm-html-report-design.md`

**Scope note:** This plan covers DOU-45, 46, 47 only (Execution View Foundation milestone). DOU-48–50 (Progress & Health Engine), DOU-51–53 (Alignment Diagnostics), and DOU-54–56 (Workflow Integration & Hardening) each require a separate plan.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `scripts/extract-md-actuals.js` | Modify | Export `extractFromText` for reuse by loader |
| `scripts/ogsm-status/parse-profile.js` | Create | Parse `.ogsm/` profile markdown → JS object |
| `scripts/ogsm-status/view-model.js` | Create | Normalized sources → unified view model (DOU-45) |
| `scripts/ogsm-status/loader.js` | Create | Read `.ogsm/` files → normalized sources (DOU-46) |
| `scripts/ogsm-status/renderer.js` | Create | View model → single HTML string (DOU-47) |
| `examples/fixtures/ogsm-status/profile-minimal.md` | Create | Minimal profile fixture for smoke tests |
| `examples/fixtures/ogsm-status/review-minimal.md` | Create | Minimal review with md-actual for smoke tests |
| `scripts/test-scripts.sh` | Modify | Add ogsm-status smoke tests |

---

## Task 1: Export `extractFromText` from extract-md-actuals.js

The loader needs to reuse the md-actual parsing logic. Currently `extract-md-actuals.js` is CLI-only.

**Files:**
- Modify: `scripts/extract-md-actuals.js`

- [ ] **Step 1: Add module.exports at the bottom of extract-md-actuals.js**

  After the final `console.log(...)` line, add:

  ```js
  if (require.main === module) {
    // CLI block already runs above — nothing to change
  }

  module.exports = { extractFromText };
  ```

  But the current file structure runs CLI code at the top level. Wrap the CLI portion in a guard first:

  Replace the bottom of the file (everything after the `extractFromText` function definition, starting from `let stat;`) with:

  ```js
  if (require.main === module) {
    let stat;
    try {
      stat = fs.statSync(target);
    } catch (e) {
      console.error(`Cannot read: ${target}`);
      process.exit(2);
    }

    const texts = stat.isDirectory()
      ? fs.readdirSync(target)
          .filter(f => f.endsWith('.md'))
          .sort()
          .map(f => fs.readFileSync(path.join(target, f), 'utf8'))
      : [fs.readFileSync(target, 'utf8')];

    const merged = {};
    for (const text of texts) {
      Object.assign(merged, extractFromText(text));
    }

    console.log(JSON.stringify(merged, null, 2));
  }

  module.exports = { extractFromText };
  ```

- [ ] **Step 2: Verify existing smoke test still passes**

  ```bash
  node scripts/extract-md-actuals.js examples/sample-weekly-review-with-actuals.md
  ```

  Expected: JSON with `"MD1-1": "25%"`, `"MD1-2": "未變"`, `"MD2-1": "12"`.

- [ ] **Step 3: Verify require works**

  ```bash
  node -e "const {extractFromText} = require('./scripts/extract-md-actuals'); console.log(extractFromText('<!-- md-actual: X=1 -->'))"
  ```

  Expected: `{ X: '1' }`

- [ ] **Step 4: Commit**

  ```bash
  git add scripts/extract-md-actuals.js
  git commit -m "refactor: export extractFromText from extract-md-actuals for reuse"
  ```

---

## Task 2: Create test fixtures

**Files:**
- Create: `examples/fixtures/ogsm-status/profile-minimal.md`
- Create: `examples/fixtures/ogsm-status/review-minimal.md`

- [ ] **Step 1: Create profile fixture**

  Create `examples/fixtures/ogsm-status/profile-minimal.md`:

  ```markdown
  ---
  scope: company
  slug: example-corp
  parent: null
  owner_unit: management
  time_horizon: 2026 Q1
  last_confirmed: 2026-01-01
  ---

  # OGSM Profile: Example Corp

  ## Objective

  Become the preferred supplier in our market by delivering faster and more reliably.

  ## Goals

  1. Increase monthly revenue from 100 to 120 by 2026-03-31.
  2. Reduce delivery days from 5 to 3 by 2026-03-31.

  ## Strategies

  1. Through direct sales outreach, grow revenue.
  2. Through logistics optimisation, reduce delivery time.

  ## MD

  1. Monthly revenue: 100 → 120, 2026-03-31, monthly, validates S1.
  2. Avg delivery days: 5 → 3, 2026-03-31, monthly, validates S2.

  ## MP

  1. owner: Alice, 2026-01-01, weekly calls to 5 new prospects.
  2. owner: Bob, 2026-02-01, audit and optimise pick-pack workflow.

  ## Review Cadence

  Monthly.

  ## Decision Rules

  - Say no to work not supporting a Strategy.
  ```

- [ ] **Step 2: Create review fixture**

  Create `examples/fixtures/ogsm-status/review-minimal.md`:

  ```markdown
  # Weekly Review 2026-01-15

  ## MD Updates
  <!-- md-actual: MD1=105, MD2=4.5 -->
  - MD1 revenue reached 105.
  - MD2 delivery days improved to 4.5.

  ## MP Status
  - MP1 完成
  - MP2 進行中
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add examples/fixtures/ogsm-status/
  git commit -m "test: add ogsm-status fixtures for smoke tests"
  ```

---

## Task 3: Implement parse-profile.js (DOU-45 prep)

**Files:**
- Create: `scripts/ogsm-status/parse-profile.js`

- [ ] **Step 1: Write the smoke test inline (run-first approach)**

  Create `scripts/ogsm-status/parse-profile.js` with only the exports stub and a self-test block at the bottom:

  ```js
  'use strict';
  const fs = require('fs');

  function parseFrontmatter(text) { return {}; }
  function parseProfile(text) { return { meta: {}, objective: null, goals: [], strategies: [], measures: [], plans: [] }; }

  if (require.main === module) {
    const assert = require('assert');
    const path = require('path');
    const fixture = fs.readFileSync(
      path.join(__dirname, '../../examples/fixtures/ogsm-status/profile-minimal.md'), 'utf8'
    );
    const result = parseProfile(fixture);
    assert.strictEqual(result.meta.slug, 'example-corp', 'meta.slug');
    assert.strictEqual(result.meta.scope, 'company', 'meta.scope');
    assert.ok(result.objective && result.objective.includes('preferred supplier'), 'objective text');
    assert.strictEqual(result.goals.length, 2, 'goals count');
    assert.ok(result.goals[0].includes('revenue'), 'first goal text');
    assert.strictEqual(result.strategies.length, 2, 'strategies count');
    assert.strictEqual(result.measures.length, 2, 'measures count');
    assert.strictEqual(result.plans.length, 2, 'plans count');
    assert.ok(result.plans[0].includes('Alice'), 'first plan owner');
    console.log('parse-profile: all assertions passed');
  }

  module.exports = { parseProfile };
  ```

- [ ] **Step 2: Run to verify it fails**

  ```bash
  node scripts/ogsm-status/parse-profile.js
  ```

  Expected: `AssertionError` on `meta.slug`.

- [ ] **Step 3: Implement parseProfile**

  Replace the stub with the full implementation:

  ```js
  'use strict';
  const fs = require('fs');

  function parseFrontmatter(text) {
    const match = text.match(/^---\n([\s\S]*?)\n---\n?/);
    if (!match) return {};
    const out = {};
    for (const line of match[1].split('\n')) {
      const colon = line.indexOf(':');
      if (colon === -1) continue;
      out[line.slice(0, colon).trim()] = line.slice(colon + 1).trim();
    }
    return out;
  }

  function extractSections(body) {
    const sections = {};
    // Split on ## headings; capture heading name and content until next ##
    const parts = body.split(/^##\s+/m);
    for (const part of parts.slice(1)) {
      const nl = part.indexOf('\n');
      const name = part.slice(0, nl).trim();
      const content = part.slice(nl + 1).trim();
      sections[name] = content;
    }
    return sections;
  }

  function parseNumberedList(text) {
    if (!text) return [];
    return text.split('\n')
      .filter(line => /^\d+\./.test(line.trim()))
      .map(line => line.replace(/^\d+\.\s*/, '').trim());
  }

  function parseProfile(text) {
    const fmMatch = text.match(/^---\n[\s\S]*?\n---\n?/);
    const meta = parseFrontmatter(text);
    const body = fmMatch ? text.slice(fmMatch[0].length) : text;
    const sections = extractSections(body);

    return {
      meta,
      objective: sections['Objective'] || null,
      goals: parseNumberedList(sections['Goals']),
      strategies: parseNumberedList(sections['Strategies']),
      measures: parseNumberedList(sections['MD']),
      plans: parseNumberedList(sections['MP']),
    };
  }

  if (require.main === module) {
    const assert = require('assert');
    const path = require('path');
    const fixture = fs.readFileSync(
      path.join(__dirname, '../../examples/fixtures/ogsm-status/profile-minimal.md'), 'utf8'
    );
    const result = parseProfile(fixture);
    assert.strictEqual(result.meta.slug, 'example-corp', 'meta.slug');
    assert.strictEqual(result.meta.scope, 'company', 'meta.scope');
    assert.ok(result.objective && result.objective.includes('preferred supplier'), 'objective text');
    assert.strictEqual(result.goals.length, 2, 'goals count');
    assert.ok(result.goals[0].includes('revenue'), 'first goal text');
    assert.strictEqual(result.strategies.length, 2, 'strategies count');
    assert.strictEqual(result.measures.length, 2, 'measures count');
    assert.strictEqual(result.plans.length, 2, 'plans count');
    assert.ok(result.plans[0].includes('Alice'), 'first plan owner');
    console.log('parse-profile: all assertions passed');
  }

  module.exports = { parseProfile };
  ```

- [ ] **Step 4: Run to verify it passes**

  ```bash
  node scripts/ogsm-status/parse-profile.js
  ```

  Expected: `parse-profile: all assertions passed`

- [ ] **Step 5: Commit**

  ```bash
  git add scripts/ogsm-status/parse-profile.js
  git commit -m "feat(ogsm-status): add parse-profile module"
  ```

---

## Task 4: Implement view-model.js (DOU-45)

**Files:**
- Create: `scripts/ogsm-status/view-model.js`

- [ ] **Step 1: Write stub + failing test**

  Create `scripts/ogsm-status/view-model.js`:

  ```js
  'use strict';

  function buildViewModel(sources) { return null; }

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

    // Test 2: with actuals → at_risk (MVP default)
    const vm2 = buildViewModel({ profile, actuals: { MD1: '105', MD2: '4.5' }, mpStatus: { MP1: 'done' }, departments: [] });
    assert.notStrictEqual(vm2.meta.health, 'no_data', 'health changes when actuals present');
    assert.notStrictEqual(vm2.goals[0].progress_pct, null, 'progress_pct is non-null when actuals present');
    assert.strictEqual(vm2.goals[0].strategies[0].plans[0].status, 'done', 'MP1 status');

    // Test 3: generated_at is today's date format YYYY-MM-DD
    assert.match(vm1.meta.generated_at, /^\d{4}-\d{2}-\d{2}$/, 'generated_at format');

    console.log('view-model: all assertions passed');
  }

  module.exports = { buildViewModel };
  ```

- [ ] **Step 2: Run to verify it fails**

  ```bash
  node scripts/ogsm-status/view-model.js
  ```

  Expected: `AssertionError` on `buildViewModel returns a value`.

- [ ] **Step 3: Implement buildViewModel**

  Replace the stub with the full implementation:

  ```js
  'use strict';

  // MVP rule: if actual exists → at_risk (conservative default).
  // DOU-48/49 will replace this with the proper computation engine.
  function mdStatus(actual) {
    return actual === null ? 'no_data' : 'at_risk';
  }

  function healthFromStatuses(statuses) {
    if (!statuses.length || statuses.every(s => s === 'no_data')) return 'no_data';
    if (statuses.some(s => s === 'off_track')) return 'off_track';
    if (statuses.some(s => s === 'at_risk')) return 'at_risk';
    return 'on_track';
  }

  function parseOwner(mpText) {
    const m = mpText.match(/owner:\s*([^,，]+)/i);
    return m ? m[1].trim() : null;
  }

  // Each MD item in the flat profile list is indexed MD1, MD2, ...
  // Actuals may use the same key or sub-keys like MD1-1, MD1-2.
  // MVP: look up exact key first, then fall back to null.
  function lookupActual(actuals, id) {
    if (!actuals) return null;
    if (actuals[id] !== undefined) return actuals[id];
    return null;
  }

  function buildViewModel(sources) {
    const { profile, actuals, mpStatus, departments } = sources;

    // In the profile, strategies and goals are parallel flat lists.
    // Each strategy S(i) pairs with goal G(i) (1-to-1 in MVP scope).
    // MD items are global: MD1 validates S1, MD2 validates S2, etc.
    const goals = profile.goals.map((goalText, gi) => {
      const goalId = `G${gi + 1}`;
      const stratText = profile.strategies[gi] || '';
      const stratId = `S${gi + 1}`;

      const mdText = profile.measures[gi] || null;
      const mdId = `MD${gi + 1}`;
      const actual = lookupActual(actuals, mdId);
      const mdItem = mdText
        ? [{ id: mdId, text: mdText, baseline: null, target: null, actual, status: mdStatus(actual) }]
        : [];

      const plans = profile.plans.map((mpText, pi) => {
        const mpId = `MP${pi + 1}`;
        return {
          id: mpId,
          text: mpText,
          owner: parseOwner(mpText),
          // status from review MP completion records; default not_started
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

      const strat = { id: stratId, text: stratText, measures: mdItem, plans, departments: depts };
      const mdStatuses = mdItem.map(m => m.status);
      const health = healthFromStatuses(mdStatuses);
      const withActuals = mdStatuses.filter(s => s !== 'no_data');
      const progress_pct = withActuals.length === 0 ? null : 100; // MVP: any actual → 100 for now

      return { id: goalId, text: goalText, health, progress_pct, strategies: [strat] };
    });

    const overallHealth = healthFromStatuses(goals.map(g => g.health));

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

    const vm1 = buildViewModel({ profile, actuals: {}, mpStatus: {}, departments: [] });
    assert.ok(vm1, 'buildViewModel returns a value');
    assert.strictEqual(vm1.meta.slug, 'example-corp');
    assert.strictEqual(vm1.meta.health, 'no_data');
    assert.strictEqual(vm1.goals.length, 2);
    assert.strictEqual(vm1.goals[0].health, 'no_data');
    assert.strictEqual(vm1.goals[0].progress_pct, null);
    assert.strictEqual(vm1.goals[0].strategies.length, 1);

    const vm2 = buildViewModel({ profile, actuals: { MD1: '105', MD2: '4.5' }, mpStatus: { MP1: 'done' }, departments: [] });
    assert.notStrictEqual(vm2.meta.health, 'no_data', 'health changes when actuals present');
    assert.notStrictEqual(vm2.goals[0].progress_pct, null, 'progress_pct non-null with actuals');
    assert.strictEqual(vm2.goals[0].strategies[0].plans[0].status, 'done', 'MP1 status');

    assert.match(vm1.meta.generated_at, /^\d{4}-\d{2}-\d{2}$/, 'generated_at format');

    console.log('view-model: all assertions passed');
  }

  module.exports = { buildViewModel };
  ```

- [ ] **Step 4: Run to verify it passes**

  ```bash
  node scripts/ogsm-status/view-model.js
  ```

  Expected: `view-model: all assertions passed`

- [ ] **Step 5: Commit**

  ```bash
  git add scripts/ogsm-status/view-model.js
  git commit -m "feat(ogsm-status): add view-model builder — DOU-45"
  ```

---

## Task 5: Implement loader.js (DOU-46)

**Files:**
- Create: `scripts/ogsm-status/loader.js`

- [ ] **Step 1: Write stub + failing test**

  Create `scripts/ogsm-status/loader.js`:

  ```js
  'use strict';

  function loadSources(ogsmDir, scope, slug) { return null; }

  if (require.main === module) {
    const assert = require('assert');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');

    // Set up a minimal .ogsm/ tree in a temp dir
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ogsm-loader-test-'));
    const fixtureDir = path.join(__dirname, '../../examples/fixtures/ogsm-status');

    fs.mkdirSync(path.join(tmp, 'profiles', 'company'), { recursive: true });
    fs.mkdirSync(path.join(tmp, 'reviews', 'company', 'example-corp'), { recursive: true });
    fs.copyFileSync(
      path.join(fixtureDir, 'profile-minimal.md'),
      path.join(tmp, 'profiles', 'company', 'example-corp.md')
    );
    fs.copyFileSync(
      path.join(fixtureDir, 'review-minimal.md'),
      path.join(tmp, 'reviews', 'company', 'example-corp', '2026-01-15-weekly.md')
    );

    // Test 1: loads profile and extracts actuals
    const sources = loadSources(tmp, 'company', 'example-corp');
    assert.ok(sources, 'loadSources returns a value');
    assert.ok(sources.profile, 'sources.profile exists');
    assert.strictEqual(sources.profile.meta.slug, 'example-corp');
    assert.strictEqual(sources.actuals['MD1'], '105', 'actuals from review');
    assert.strictEqual(sources.actuals['MD2'], '4.5', 'actuals MD2');
    assert.strictEqual(sources.mpStatus['MP1'], 'done', 'MP1 done');
    assert.strictEqual(sources.mpStatus['MP2'], 'in_progress', 'MP2 in_progress');

    // Test 2: missing profile throws
    assert.throws(() => loadSources(tmp, 'company', 'nonexistent'), /not found/i);

    // Cleanup
    fs.rmSync(tmp, { recursive: true });

    console.log('loader: all assertions passed');
  }

  module.exports = { loadSources };
  ```

- [ ] **Step 2: Run to verify it fails**

  ```bash
  node scripts/ogsm-status/loader.js
  ```

  Expected: `AssertionError` on `loadSources returns a value`.

- [ ] **Step 3: Implement loadSources**

  Replace the stub:

  ```js
  'use strict';
  const fs = require('fs');
  const path = require('path');
  const { parseProfile } = require('./parse-profile');
  const { extractFromText } = require('../extract-md-actuals');

  const MP_DONE_RE = /^[-*]\s+(MP[\d-]+)\s+(完成|done|✅)/gim;
  const MP_PROGRESS_RE = /^[-*]\s+(MP[\d-]+)\s+(進行中|in[- ]?progress)/gim;

  function collectActuals(reviewDir) {
    if (!fs.existsSync(reviewDir)) return {};
    const merged = {};
    for (const f of fs.readdirSync(reviewDir).filter(f => f.endsWith('.md')).sort()) {
      const text = fs.readFileSync(path.join(reviewDir, f), 'utf8');
      Object.assign(merged, extractFromText(text));
    }
    return merged;
  }

  function collectMpStatus(reviewDir) {
    if (!fs.existsSync(reviewDir)) return {};
    const status = {};
    for (const f of fs.readdirSync(reviewDir).filter(f => f.endsWith('.md')).sort()) {
      const text = fs.readFileSync(path.join(reviewDir, f), 'utf8');
      for (const m of text.matchAll(MP_DONE_RE)) status[m[1]] = 'done';
      for (const m of text.matchAll(MP_PROGRESS_RE)) status[m[1]] = 'in_progress';
    }
    return status;
  }

  function loadSources(ogsmDir, scope, slug) {
    const profilePath = path.join(ogsmDir, 'profiles', scope, `${slug}.md`);
    if (!fs.existsSync(profilePath)) {
      throw new Error(`Profile not found: ${profilePath}`);
    }

    const profile = parseProfile(fs.readFileSync(profilePath, 'utf8'));
    const reviewDir = path.join(ogsmDir, 'reviews', scope, slug);
    const actuals = collectActuals(reviewDir);
    const mpStatus = collectMpStatus(reviewDir);

    const departments = [];
    if (scope === 'company') {
      const deptDir = path.join(ogsmDir, 'profiles', 'departments');
      if (fs.existsSync(deptDir)) {
        for (const f of fs.readdirSync(deptDir).filter(f => f.endsWith('.md'))) {
          try {
            const d = parseProfile(fs.readFileSync(path.join(deptDir, f), 'utf8'));
            if (d.meta.parent === `company/${slug}`) departments.push(d);
          } catch (_) { /* skip unparseable */ }
        }
      }
    }

    return { profile, actuals, mpStatus, departments };
  }

  if (require.main === module) {
    const assert = require('assert');
    const os = require('os');

    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ogsm-loader-test-'));
    const fixtureDir = path.join(__dirname, '../../examples/fixtures/ogsm-status');

    fs.mkdirSync(path.join(tmp, 'profiles', 'company'), { recursive: true });
    fs.mkdirSync(path.join(tmp, 'reviews', 'company', 'example-corp'), { recursive: true });
    fs.copyFileSync(
      path.join(fixtureDir, 'profile-minimal.md'),
      path.join(tmp, 'profiles', 'company', 'example-corp.md')
    );
    fs.copyFileSync(
      path.join(fixtureDir, 'review-minimal.md'),
      path.join(tmp, 'reviews', 'company', 'example-corp', '2026-01-15-weekly.md')
    );

    const sources = loadSources(tmp, 'company', 'example-corp');
    assert.ok(sources, 'loadSources returns a value');
    assert.ok(sources.profile, 'sources.profile exists');
    assert.strictEqual(sources.profile.meta.slug, 'example-corp');
    assert.strictEqual(sources.actuals['MD1'], '105', 'actuals MD1');
    assert.strictEqual(sources.actuals['MD2'], '4.5', 'actuals MD2');
    assert.strictEqual(sources.mpStatus['MP1'], 'done', 'MP1 done');
    assert.strictEqual(sources.mpStatus['MP2'], 'in_progress', 'MP2 in_progress');

    assert.throws(() => loadSources(tmp, 'company', 'nonexistent'), /not found/i);

    fs.rmSync(tmp, { recursive: true });
    console.log('loader: all assertions passed');
  }

  module.exports = { loadSources };
  ```

- [ ] **Step 4: Run to verify it passes**

  ```bash
  node scripts/ogsm-status/loader.js
  ```

  Expected: `loader: all assertions passed`

- [ ] **Step 5: Commit**

  ```bash
  git add scripts/ogsm-status/loader.js
  git commit -m "feat(ogsm-status): add loader — DOU-46"
  ```

---

## Task 6: Implement renderer.js (DOU-47)

**Files:**
- Create: `scripts/ogsm-status/renderer.js`

- [ ] **Step 1: Write stub + failing tests**

  Create `scripts/ogsm-status/renderer.js` with stub and tests:

  ```js
  'use strict';

  function render(vm) { return ''; }

  if (require.main === module) {
    const assert = require('assert');
    const { parseProfile } = require('./parse-profile');
    const { buildViewModel } = require('./view-model');
    const fs = require('fs');
    const path = require('path');

    const profileText = fs.readFileSync(
      path.join(__dirname, '../../examples/fixtures/ogsm-status/profile-minimal.md'), 'utf8'
    );
    const profile = parseProfile(profileText);
    const vm = buildViewModel({ profile, actuals: { MD1: '105' }, mpStatus: { MP1: 'done' }, departments: [] });
    const html = render(vm);

    assert.ok(html.startsWith('<!DOCTYPE html>'), 'starts with DOCTYPE');
    assert.ok(html.includes('<style>'), 'has inline CSS');
    assert.ok(!html.includes('<link'), 'no external CSS link');
    assert.ok(!html.includes('<script'), 'no script tags');
    assert.ok(html.includes('example-corp'), 'contains slug');
    assert.ok(html.includes('preferred supplier'), 'contains objective text');
    assert.ok(html.includes('Section 1'), 'has Section 1');
    assert.ok(html.includes('Section 2'), 'has Section 2');
    assert.ok(html.includes('<details'), 'uses details element');
    assert.ok(html.includes('105'), 'shows actual value');
    assert.ok(html.includes('✅'), 'shows done MP');
    assert.ok(html.includes('@media print'), 'has print styles');

    // no-data case: no actuals → shows No Data markers
    const vmEmpty = buildViewModel({ profile, actuals: {}, mpStatus: {}, departments: [] });
    const htmlEmpty = render(vmEmpty);
    assert.ok(htmlEmpty.includes('No Data') || htmlEmpty.includes('no_data'), 'empty shows no data');

    console.log('renderer: all assertions passed');
  }

  module.exports = { render };
  ```

- [ ] **Step 2: Run to verify it fails**

  ```bash
  node scripts/ogsm-status/renderer.js
  ```

  Expected: `AssertionError` on `starts with DOCTYPE`.

- [ ] **Step 3: Implement render**

  Replace the stub with the full implementation:

  ```js
  'use strict';

  const HEALTH_LABEL = {
    on_track: '🟢 On Track',
    at_risk: '🟡 At Risk',
    off_track: '🔴 Off Track',
    no_data: '⚪ No Data',
  };

  const PLAN_ICON = { done: '✅', in_progress: '🔄', not_started: '⬜', delayed: '❌' };

  const CSS = `
  body{font-family:system-ui,sans-serif;max-width:960px;margin:0 auto;padding:24px 32px;font-size:16px;color:#1a1a1a;line-height:1.6}
  h1{font-size:1.4em;margin:0 0 4px}
  .meta{color:#6b7280;font-size:.9em;margin-bottom:28px}
  .section-title{font-size:1.1em;font-weight:600;border-bottom:2px solid #e5e7eb;padding-bottom:6px;margin:32px 0 16px}
  .objective{background:#f9fafb;border-left:4px solid #6366f1;padding:12px 16px;border-radius:4px;margin-bottom:20px;font-style:italic}
  .goal-row{display:flex;align-items:baseline;gap:12px;padding:8px 0;border-bottom:1px solid #f3f4f6;flex-wrap:wrap}
  .goal-id{font-weight:700;min-width:32px;color:#6366f1}
  .goal-text{flex:1;min-width:200px}
  .pct{font-size:.9em;color:#6b7280}
  .health-on_track{color:#166534}
  .health-at_risk{color:#92400e}
  .health-off_track{color:#991b1b}
  .health-no_data{color:#9ca3af}
  .strategy{margin:12px 0 4px;padding:8px 14px;background:#f9fafb;border-radius:4px;border-left:3px solid #e5e7eb}
  .strategy-id{font-weight:600;color:#6366f1;margin-right:6px}
  .md-table{width:100%;border-collapse:collapse;font-size:.88em;margin:8px 0}
  .md-table th{text-align:left;padding:4px 8px;background:#f3f4f6;font-weight:500}
  .md-table td{padding:4px 8px;border-bottom:1px solid #f3f4f6;vertical-align:top}
  details>summary{cursor:pointer;color:#6366f1;font-size:.9em;padding:4px 0;user-select:none}
  details>summary:hover{text-decoration:underline}
  .dept{margin:4px 0 4px 12px;padding:8px 12px;border-left:2px solid #e5e7eb}
  .mp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:8px;margin:8px 0}
  .mp-card{padding:8px 12px;border:1px solid #e5e7eb;border-radius:4px;font-size:.88em}
  .mp-id{font-weight:600;color:#6366f1;margin-right:4px}
  .owner{color:#6b7280;font-size:.85em}
  .mp-text{color:#374151;margin-top:2px}
  .actuals-list{margin:8px 0;padding-left:20px;font-size:.9em}
  .actuals-list li{padding:2px 0}
  .no-data-note{color:#9ca3af;font-size:.9em;font-style:italic}
  footer{margin-top:48px;padding-top:12px;border-top:1px solid #e5e7eb;font-size:.8em;color:#9ca3af}
  @media print{details,details[open]{display:block}details>summary{list-style:none}details>summary::marker{display:none}}
  `;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function healthBadge(h) {
    return `<span class="health-${esc(h)}">${esc(HEALTH_LABEL[h] || h)}</span>`;
  }

  function renderMdTable(measures) {
    if (!measures.length) return '';
    const rows = measures.map(m => `<tr>
      <td>${esc(m.id)}</td>
      <td>${esc(m.text)}</td>
      <td>${m.actual !== null ? esc(m.actual) : '<span class="health-no_data">—</span>'}</td>
      <td>${healthBadge(m.status)}</td>
    </tr>`).join('');
    return `<table class="md-table">
      <thead><tr><th>ID</th><th>Measure</th><th>Actual</th><th>Status</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
  }

  function renderStrategy(s) {
    const depts = s.departments.map(d => `<details>
      <summary>Dept: ${esc(d.name)}</summary>
      <div class="dept"><strong>${esc(d.name)}</strong>${renderMdTable(d.measures)}</div>
    </details>`).join('');
    return `<div class="strategy">
      <span class="strategy-id">${esc(s.id)}</span>${esc(s.text)}
      ${renderMdTable(s.measures)}
      ${depts}
    </div>`;
  }

  function renderSection1(vm) {
    const goalRows = vm.goals.map(g => {
      const pctHtml = g.progress_pct !== null
        ? `<span class="pct">${g.progress_pct}%</span>`
        : `<span class="health-no_data pct">—</span>`;
      return `<div class="goal-row">
        <span class="goal-id">${esc(g.id)}</span>
        <span class="goal-text">${esc(g.text)}</span>
        ${pctHtml}
        ${healthBadge(g.health)}
      </div>
      ${g.strategies.map(renderStrategy).join('')}`;
    }).join('');

    return `<div class="section-title">Section 1: Where Are We?</div>
      <div class="objective">${esc(vm.objective.text)}</div>
      ${goalRows}`;
  }

  function renderSection2(vm) {
    const allPlans = vm.goals.flatMap(g => g.strategies.flatMap(s => s.plans));
    const allMeasures = vm.goals.flatMap(g => g.strategies.flatMap(s => s.measures));
    const withActuals = allMeasures.filter(m => m.actual !== null);

    const mpCards = allPlans.length
      ? allPlans.map(p => `<div class="mp-card">
          <span class="mp-id">${esc(p.id)}</span>${PLAN_ICON[p.status] || '⬜'}
          ${p.owner ? `<span class="owner">${esc(p.owner)}</span>` : ''}
          <div class="mp-text">${esc(p.text.length > 80 ? p.text.slice(0, 80) + '…' : p.text)}</div>
        </div>`).join('')
      : '<p class="no-data-note">No plans defined.</p>';

    const actualItems = withActuals.length
      ? withActuals.map(m => `<li><strong>${esc(m.id)}</strong>: ${esc(m.actual)}</li>`).join('')
      : '<li class="no-data-note">No actuals recorded yet.</li>';

    return `<div class="section-title">Section 2: What Did We Do?</div>
      <p style="font-weight:500;margin:0 0 8px">MP Status this period</p>
      <div class="mp-grid">${mpCards}</div>
      <p style="font-weight:500;margin:16px 0 8px">MD Updates</p>
      <ul class="actuals-list">${actualItems}</ul>`;
  }

  function render(vm) {
    const healthLabel = esc(HEALTH_LABEL[vm.meta.health] || vm.meta.health);
    return `<!DOCTYPE html>
  <html lang="en">
  <head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>OGSM Report — ${esc(vm.meta.slug)} ${esc(vm.meta.period)}</title>
  <style>${CSS}</style>
  </head>
  <body>
  <h1>OGSM Report — ${esc(vm.meta.slug)}</h1>
  <div class="meta">${esc(vm.meta.period)} &nbsp;|&nbsp; ${healthLabel} &nbsp;|&nbsp; Generated ${esc(vm.meta.generated_at)}</div>
  ${renderSection1(vm)}
  ${renderSection2(vm)}
  <footer>Scope: ${esc(vm.meta.scope)} / ${esc(vm.meta.slug)} &nbsp;|&nbsp; OGSM Plugin</footer>
  </body>
  </html>`;
  }

  if (require.main === module) {
    const assert = require('assert');
    const { parseProfile } = require('./parse-profile');
    const { buildViewModel } = require('./view-model');
    const fs = require('fs');
    const path = require('path');

    const profileText = fs.readFileSync(
      path.join(__dirname, '../../examples/fixtures/ogsm-status/profile-minimal.md'), 'utf8'
    );
    const profile = parseProfile(profileText);
    const vm = buildViewModel({ profile, actuals: { MD1: '105' }, mpStatus: { MP1: 'done' }, departments: [] });
    const html = render(vm);

    assert.ok(html.startsWith('<!DOCTYPE html>'), 'starts with DOCTYPE');
    assert.ok(html.includes('<style>'), 'has inline CSS');
    assert.ok(!html.includes('<link'), 'no external CSS link');
    assert.ok(!html.includes('<script'), 'no script tags');
    assert.ok(html.includes('example-corp'), 'contains slug');
    assert.ok(html.includes('preferred supplier'), 'contains objective text');
    assert.ok(html.includes('Section 1'), 'has Section 1');
    assert.ok(html.includes('Section 2'), 'has Section 2');
    assert.ok(html.includes('<details'), 'uses details element');
    assert.ok(html.includes('105'), 'shows actual value');
    assert.ok(html.includes('✅'), 'shows done MP');
    assert.ok(html.includes('@media print'), 'has print styles');

    const vmEmpty = buildViewModel({ profile, actuals: {}, mpStatus: {}, departments: [] });
    const htmlEmpty = render(vmEmpty);
    assert.ok(htmlEmpty.includes('No Data') || htmlEmpty.includes('no_data'), 'empty shows no data');

    console.log('renderer: all assertions passed');
  }

  module.exports = { render };
  ```

- [ ] **Step 4: Run to verify it passes**

  ```bash
  node scripts/ogsm-status/renderer.js
  ```

  Expected: `renderer: all assertions passed`

- [ ] **Step 5: Open the HTML output to visually verify**

  ```bash
  node -e "
  const {parseProfile} = require('./scripts/ogsm-status/parse-profile');
  const {buildViewModel} = require('./scripts/ogsm-status/view-model');
  const {render} = require('./scripts/ogsm-status/renderer');
  const fs = require('fs');
  const profile = parseProfile(fs.readFileSync('examples/fixtures/ogsm-status/profile-minimal.md','utf8'));
  const vm = buildViewModel({profile, actuals:{MD1:'105',MD2:'4.5'}, mpStatus:{MP1:'done',MP2:'in_progress'}, departments:[]});
  fs.writeFileSync('/tmp/ogsm-report-preview.html', render(vm));
  console.log('Written to /tmp/ogsm-report-preview.html');
  "
  open /tmp/ogsm-report-preview.html
  ```

  Verify: two sections visible, health badges, MP cards, MD updates list.

- [ ] **Step 6: Commit**

  ```bash
  git add scripts/ogsm-status/renderer.js
  git commit -m "feat(ogsm-status): add HTML renderer — DOU-47"
  ```

---

## Task 7: Wire smoke tests into test-scripts.sh

**Files:**
- Modify: `scripts/test-scripts.sh`

- [ ] **Step 1: Add smoke test calls before the final `validate-architecture.sh` line**

  Add at the end of `scripts/test-scripts.sh`, before the last `"$script_dir/validate-architecture.sh"` line:

  ```sh
  # ogsm-status: parse-profile smoke test
  node "$script_dir/ogsm-status/parse-profile.js"

  # ogsm-status: view-model smoke test
  node "$script_dir/ogsm-status/view-model.js"

  # ogsm-status: loader smoke test
  node "$script_dir/ogsm-status/loader.js"

  # ogsm-status: renderer smoke test
  node "$script_dir/ogsm-status/renderer.js"

  # ogsm-status: end-to-end — loader → view-model → renderer → valid HTML output
  tmp_ogsm_e2e="$(mktemp -d)"
  mkdir -p "$tmp_ogsm_e2e/profiles/company" "$tmp_ogsm_e2e/reviews/company/example-corp"
  cp "$plugin_root/examples/fixtures/ogsm-status/profile-minimal.md" \
     "$tmp_ogsm_e2e/profiles/company/example-corp.md"
  cp "$plugin_root/examples/fixtures/ogsm-status/review-minimal.md" \
     "$tmp_ogsm_e2e/reviews/company/example-corp/2026-01-15-weekly.md"
  node -e "
    const {loadSources}=require('$plugin_root/scripts/ogsm-status/loader');
    const {buildViewModel}=require('$plugin_root/scripts/ogsm-status/view-model');
    const {render}=require('$plugin_root/scripts/ogsm-status/renderer');
    const src=loadSources('$tmp_ogsm_e2e','company','example-corp');
    const vm=buildViewModel(src);
    const html=render(vm);
    if(!html.startsWith('<!DOCTYPE html>')) throw new Error('bad output');
    process.stdout.write(html);
  " > "$tmp_ogsm_e2e/out.html"
  grep -F 'example-corp' "$tmp_ogsm_e2e/out.html" >/dev/null
  grep -F 'Section 1' "$tmp_ogsm_e2e/out.html" >/dev/null
  grep -F 'Section 2' "$tmp_ogsm_e2e/out.html" >/dev/null
  rm -rf "$tmp_ogsm_e2e"
  ```

- [ ] **Step 2: Run the full test suite**

  ```bash
  scripts/test-scripts.sh
  ```

  Expected: all tests pass, no errors.

- [ ] **Step 3: Commit**

  ```bash
  git add scripts/test-scripts.sh
  git commit -m "test(ogsm-status): add smoke tests to test-scripts.sh — DOU-45/46/47"
  ```

---

## Task 8: Update Linear issue statuses

- [ ] Mark **DOU-45** as Done in Linear
- [ ] Mark **DOU-46** as Done in Linear
- [ ] Mark **DOU-47** as Done in Linear

---

## Done Definition Checklist

- [ ] `scripts/test-scripts.sh` passes end-to-end
- [ ] A profile with no reviews produces a valid HTML report with ⚪ No Data markers
- [ ] A profile with reviews shows actuals and MP status
- [ ] HTML output has no external CSS or JS dependencies
- [ ] `<details>` expand/collapse works in browser
- [ ] `@media print` present in CSS
- [ ] All three Linear issues marked Done
