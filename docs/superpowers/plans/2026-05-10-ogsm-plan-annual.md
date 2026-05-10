# ogsm-plan-annual Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new `ogsm-plan-annual` skill that generates a full-year MD/MP tracking table from an OGSM profile and updates it monthly using actuals extracted from weekly reviews.

**Architecture:** A new standalone skill (`skills/ogsm-plan-annual/SKILL.md`) with two modes—Generate (year-start) and Update (month-end). Two new Node.js scripts handle table generation (`generate-annual-plan.js`) and MD actual extraction (`extract-md-actuals.js`). Annual plan tables are stored in `.ogsm/plans/<scope>/<slug>/<year>-annual.md`. Existing skills get minor Handoff additions; no profile format changes.

**Tech Stack:** Node.js (CommonJS, no dependencies), Bash, Markdown.

---

## File Map

| Action | Path |
|--------|------|
| Create | `skills/ogsm-plan-annual/SKILL.md` |
| Create | `skills/ogsm-plan-annual/references/.gitkeep` |
| Create | `skills/ogsm-plan-annual/scripts/.gitkeep` |
| Create | `skills/ogsm-plan-annual/assets/.gitkeep` |
| Create | `scripts/extract-md-actuals.js` |
| Create | `scripts/generate-annual-plan.js` |
| Create | `examples/sample-annual-plan-input.json` |
| Create | `examples/sample-weekly-review-with-actuals.md` |
| Modify | `plugin.toml` — register new skill |
| Modify | `skills/ogsm-translate/SKILL.md` — add Handoff prompt |
| Modify | `skills/ogsm-weekly-review/SKILL.md` — add md-actual marker instruction |
| Modify | `scripts/validate-architecture.sh` — add ogsm-plan-annual to skill list |
| Modify | `scripts/test-scripts.sh` — add smoke tests for new scripts |
| Modify | `references/storage-policy.md` — document `.ogsm/plans/` path |

---

## Task 1: Skill Scaffold + plugin.toml Registration

**Files:**
- Create: `skills/ogsm-plan-annual/SKILL.md`
- Create: `skills/ogsm-plan-annual/references/.gitkeep`
- Create: `skills/ogsm-plan-annual/scripts/.gitkeep`
- Create: `skills/ogsm-plan-annual/assets/.gitkeep`
- Modify: `plugin.toml`

- [ ] **Step 1: Create the three required subdirectories**

```bash
mkdir -p skills/ogsm-plan-annual/references skills/ogsm-plan-annual/scripts skills/ogsm-plan-annual/assets
touch skills/ogsm-plan-annual/references/.gitkeep skills/ogsm-plan-annual/scripts/.gitkeep skills/ogsm-plan-annual/assets/.gitkeep
```

- [ ] **Step 2: Create `skills/ogsm-plan-annual/SKILL.md`**

```markdown
---
name: ogsm-plan-annual
description: "Use when the user wants to create or update a full-year MD/MP tracking table. Also triggers on: 「產生年度計畫表」「建立年度追蹤」「更新本月實際值」「月底更新 MD」「ogsm-plan-annual」"
---

# OGSM Plan Annual

Use this skill to generate a full-year MD/MP milestone and tracking table from a confirmed OGSM profile, and to update it with monthly actual values extracted from weekly reviews.

## Inputs

**Generate mode:**
- Confirmed OGSM profile.
- Target year (default: current year).

**Update mode:**
- Existing annual plan table at `.ogsm/plans/<scope>/<slug>/<year>-annual.md`.
- Recent weekly review files for the current month under `.ogsm/reviews/<scope>/<slug>/`.
- Month to update (default: current month).

## Outputs

**Generate mode:**
- Annual plan markdown table at `.ogsm/plans/<scope>/<slug>/<year>-annual.md`.
- One row-pair (plan + actual) per Strategy per Goal, with 12 month columns each containing MD and MP sub-cells.

**Update mode:**
- Updated annual plan table with actual MD values filled in for the specified month.
- MP completion status (✓ / ✗) for the specified month.

## Workflow

### Generate Mode

1. Read the OGSM profile. Derive scope and slug from profile metadata.
2. Read `../../references/storage-policy.md` to confirm target path.
3. For each MD item, show its baseline, target, and deadline. Propose linear monthly milestones (e.g., baseline=20%, target=80%, 12 months → +5%/month). Explain reasoning. Ask the user to confirm or adjust each MD's monthly values.
4. For each Strategy, list its MP items. Confirm which months each MP is active.
5. Assemble the plan JSON and run: `node ../../scripts/generate-annual-plan.js <plan-data.json>`
6. Show the generated table preview.
7. Show target path, content summary, and new-file notice. Ask for confirmation before writing.
8. Write confirmed output to `.ogsm/plans/<scope>/<slug>/<year>-annual.md`.

### Update Mode

1. Identify the annual plan file path from profile metadata and the target year.
2. Identify the month to update (default: current month, 1-indexed).
3. Run: `node ../../scripts/extract-md-actuals.js .ogsm/reviews/<scope>/<slug>/`
4. Show extracted MD actual values. Ask the user to confirm or correct each value.
5. Ask the user for MP completion status (✓ / ✗) for each MP active this month.
6. Show target path, diff summary (which cells change), and recorded date. Ask for confirmation.
7. Update the annual plan file: replace `實際: —` with `實際: <confirmed value>` in the correct month column, and add ✓/✗ to MP cells.

## Progressive Disclosure

- Read storage policy only when writing the plan file.
- Read profile format only when validating profile metadata.

## Tools

- May read OGSM profile, weekly review files, and annual plan files.
- May write `.ogsm/plans/` files only after storage policy, target path, content summary, and user confirmation.
- Must not silently change the annual plan file.
- Must not use Google Calendar.

## Handoff

完成後根據情況推薦或執行下一步：
- Generate 完成 → 推薦 `ogsm-audit-schedule`：「年度計畫表已建立。要審查本週行程是否支持第一個月的 MP 計畫嗎？」
- Update 完成 → 推薦 `ogsm-weekly-review`：「本月實際值已更新。要繼續本週的 OGSM 週回顧嗎？」
```

- [ ] **Step 3: Register in `plugin.toml`**

Append to the end of `plugin.toml`:

```toml
[[skills]]
name = "ogsm-plan-annual"
path = "skills/ogsm-plan-annual/SKILL.md"
```

- [ ] **Step 4: Commit**

```bash
git add skills/ogsm-plan-annual/ plugin.toml
git commit -m "feat: add ogsm-plan-annual skill scaffold and plugin.toml registration"
```

---

## Task 2: Write `extract-md-actuals.js`

**Files:**
- Create: `scripts/extract-md-actuals.js`
- Create: `examples/sample-weekly-review-with-actuals.md`

- [ ] **Step 1: Create the fixture file `examples/sample-weekly-review-with-actuals.md`**

```markdown
# Weekly Review 2026-05-09

## MD 移動摘要
<!-- md-actual: MD1-1=25%, MD1-2=未變, MD2-1=12 -->
- MD1-1 轉換率：22% → 25%（+3%），本週客戶開發活動帶動
- MD1-2 毛利率：本週無明顯變動，持續觀察
- MD2-1 新客戶數：累計 12 家

## MP 完成摘要
- MP1-1-1 完成
- MP2-1-1 進行中
```

- [ ] **Step 2: Write the failing test by adding to `test-scripts.sh` (before the final `validate-architecture.sh` line)**

Open `scripts/test-scripts.sh` and insert before the last line (`"$script_dir/validate-architecture.sh"`):

```sh
# extract-md-actuals: sample weekly review → extracts MD values
node "$script_dir/extract-md-actuals.js" "$plugin_root/examples/sample-weekly-review-with-actuals.md" > "$tmp_output"
grep -F '"MD1-1"' "$tmp_output" >/dev/null
grep -F '"25%"' "$tmp_output" >/dev/null
grep -F '"MD1-2"' "$tmp_output" >/dev/null
grep -F '"未變"' "$tmp_output" >/dev/null
grep -F '"MD2-1"' "$tmp_output" >/dev/null
grep -F '"12"' "$tmp_output" >/dev/null

# extract-md-actuals: no args → exit 2
if node "$script_dir/extract-md-actuals.js" > "$tmp_output" 2>&1; then
  echo "Expected no-args to exit 2" >&2
  exit 1
fi
```

- [ ] **Step 3: Run the test to verify it fails**

```bash
bash scripts/test-scripts.sh 2>&1 | tail -5
```

Expected: error about `extract-md-actuals.js` not found or not executable.

- [ ] **Step 4: Create `scripts/extract-md-actuals.js`**

```js
#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');

const target = process.argv[2];
if (!target) {
  console.error('Usage: extract-md-actuals.js <review-file-or-dir>');
  process.exit(2);
}

const MD_ACTUAL_RE = /<!--\s*md-actual:\s*([^-]+?)\s*-->/g;

function extractFromText(text) {
  const results = {};
  const matches = [...text.matchAll(MD_ACTUAL_RE)];
  for (const match of matches) {
    for (const part of match[1].split(',')) {
      const eqIdx = part.indexOf('=');
      if (eqIdx === -1) continue;
      const id = part.slice(0, eqIdx).trim();
      const value = part.slice(eqIdx + 1).trim();
      if (id && value) results[id] = value;
    }
  }
  return results;
}

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
```

- [ ] **Step 5: Make the script executable**

```bash
chmod +x scripts/extract-md-actuals.js
```

- [ ] **Step 6: Run the test to verify it passes**

```bash
bash scripts/test-scripts.sh 2>&1 | tail -5
```

Expected: reaches `validate-architecture.sh` (which will fail on ogsm-plan-annual not yet in the check list — that is fine for now; the extract-md-actuals tests should pass).

- [ ] **Step 7: Commit**

```bash
git add scripts/extract-md-actuals.js examples/sample-weekly-review-with-actuals.md scripts/test-scripts.sh
git commit -m "feat: add extract-md-actuals.js and smoke tests"
```

---

## Task 3: Write `generate-annual-plan.js`

**Files:**
- Create: `scripts/generate-annual-plan.js`
- Create: `examples/sample-annual-plan-input.json`

- [ ] **Step 1: Create the fixture `examples/sample-annual-plan-input.json`**

```json
{
  "slug": "xxx-company",
  "scope": "company",
  "year": 2026,
  "objective": "成為台灣鋼材市場首選供應商",
  "parentGoalRef": null,
  "goals": [
    {
      "id": "G1",
      "name": "市佔率提升",
      "strategies": [
        {
          "id": "S1-1",
          "mds": [
            {
              "id": "MD1-1",
              "months": [
                {"planned": "22%", "actual": "23%"},
                {"planned": "25%", "actual": null},
                {"planned": "28%", "actual": null},
                {"planned": "31%", "actual": null},
                {"planned": "34%", "actual": null},
                {"planned": "37%", "actual": null},
                {"planned": "40%", "actual": null},
                {"planned": "43%", "actual": null},
                {"planned": "46%", "actual": null},
                {"planned": "49%", "actual": null},
                {"planned": "52%", "actual": null},
                {"planned": "55%", "actual": null}
              ]
            }
          ],
          "mps": [
            {
              "id": "MP1-1-1",
              "months": [true, false, false, false, false, false, false, false, false, false, false, false],
              "completed": [true, null, null, null, null, null, null, null, null, null, null, null]
            },
            {
              "id": "MP1-1-2",
              "months": [false, true, false, false, false, false, false, false, false, false, false, false],
              "completed": [null, false, null, null, null, null, null, null, null, null, null, null]
            }
          ]
        }
      ]
    }
  ]
}
```

- [ ] **Step 2: Add the failing test to `test-scripts.sh`** (insert before the final `validate-architecture.sh` line)

```sh
# generate-annual-plan: sample input → produces markdown table with headers
node "$script_dir/generate-annual-plan.js" "$plugin_root/examples/sample-annual-plan-input.json" > "$tmp_output"
grep -F '# 年度計畫表 · xxx-company · 2026' "$tmp_output" >/dev/null
grep -F '> O: 成為台灣鋼材市場首選供應商' "$tmp_output" >/dev/null
grep -F '1月 MD' "$tmp_output" >/dev/null
grep -F '12月 MP' "$tmp_output" >/dev/null
grep -F 'G1: 市佔率提升' "$tmp_output" >/dev/null
grep -F '計畫: 22%' "$tmp_output" >/dev/null
grep -F '實際: 23%' "$tmp_output" >/dev/null
grep -F 'MP1-1-1 ✓' "$tmp_output" >/dev/null
grep -F 'MP1-1-2 ✗' "$tmp_output" >/dev/null

# generate-annual-plan: no args → exit 2
if node "$script_dir/generate-annual-plan.js" > "$tmp_output" 2>&1; then
  echo "Expected no-args to exit 2" >&2
  exit 1
fi

# generate-annual-plan: invalid JSON → exit 2
printf '{' > "$tmp_invalid_json"
if node "$script_dir/generate-annual-plan.js" "$tmp_invalid_json" > "$tmp_output" 2>&1; then
  echo "Expected invalid JSON to fail" >&2
  exit 1
fi
grep -F 'Invalid JSON' "$tmp_output" >/dev/null
```

- [ ] **Step 3: Run the test to verify it fails**

```bash
bash scripts/test-scripts.sh 2>&1 | grep -E 'generate-annual|error|Error' | head -5
```

Expected: error that `generate-annual-plan.js` does not exist.

- [ ] **Step 4: Create `scripts/generate-annual-plan.js`**

```js
#!/usr/bin/env node
'use strict';
const fs = require('fs');

const file = process.argv[2];
if (!file) {
  console.error('Usage: generate-annual-plan.js <plan-data.json>');
  process.exit(2);
}

let data;
try {
  data = JSON.parse(fs.readFileSync(file, 'utf8'));
} catch (e) {
  console.error(`Invalid JSON: ${e.message}`);
  process.exit(2);
}

const { slug, scope, year, objective, parentGoalRef, goals } = data;
if (!slug || !scope || !year || !objective || !Array.isArray(goals)) {
  console.error('Missing required fields: slug, scope, year, objective, goals');
  process.exit(2);
}

const MONTHS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

const headerCols = ['目標 G', '策略 S', ...MONTHS.flatMap(m => [`${m} MD`, `${m} MP`])];
const separator = headerCols.map(() => '---');

const lines = [
  `# 年度計畫表 · ${slug} · ${year}`,
  '',
  `> O: ${objective}`,
];
if (parentGoalRef) lines.push(`> 對齊公司目標: ${parentGoalRef}`);
lines.push('', `| ${headerCols.join(' | ')} |`, `| ${separator.join(' | ')} |`);

for (const goal of goals) {
  let firstStrategy = true;
  for (const strategy of goal.strategies) {
    const mds = strategy.mds || [];
    const mps = strategy.mps || [];

    // Plan row: planned MD values + active MP ids (no completion marker yet)
    const planMdCells = MONTHS.map((_, i) =>
      mds.map(md => {
        const m = (md.months || [])[i];
        return m ? `${md.id}: 計畫: ${m.planned}` : '';
      }).filter(Boolean).join('; ')
    );
    const planMpCells = MONTHS.map((_, i) =>
      mps.filter(mp => (mp.months || [])[i]).map(mp => mp.id).join(' ')
    );

    const goalCell = firstStrategy ? `${goal.id}: ${goal.name}` : '';
    firstStrategy = false;
    const planCells = MONTHS.flatMap((_, i) => [planMdCells[i], planMpCells[i]]);
    lines.push(`| ${[goalCell, strategy.id, ...planCells].join(' | ')} |`);

    // Actual row: actual MD values + MP completion status
    const actualMdCells = MONTHS.map((_, i) =>
      mds.map(md => {
        const m = (md.months || [])[i];
        if (!m) return '';
        const actual = m.actual != null ? m.actual : '—';
        return `${md.id}: 實際: ${actual}`;
      }).filter(Boolean).join('; ')
    );
    const actualMpCells = MONTHS.map((_, i) =>
      mps
        .filter(mp => (mp.months || [])[i])
        .map(mp => {
          const done = (mp.completed || [])[i];
          if (done === true) return `${mp.id} ✓`;
          if (done === false) return `${mp.id} ✗`;
          return '';
        })
        .filter(Boolean)
        .join(' ')
    );
    const actualCells = MONTHS.flatMap((_, i) => [actualMdCells[i], actualMpCells[i]]);
    lines.push(`| | | ${actualCells.join(' | ')} |`);
  }
}

console.log(lines.join('\n'));
```

- [ ] **Step 5: Make the script executable**

```bash
chmod +x scripts/generate-annual-plan.js
```

- [ ] **Step 6: Run the tests to verify they pass**

```bash
bash scripts/test-scripts.sh 2>&1 | tail -5
```

Expected: all tests pass except `validate-architecture.sh` (which checks for the new skill — fixed in Task 6).

- [ ] **Step 7: Commit**

```bash
git add scripts/generate-annual-plan.js examples/sample-annual-plan-input.json scripts/test-scripts.sh
git commit -m "feat: add generate-annual-plan.js and smoke tests"
```

---

## Task 4: Update `ogsm-translate` Handoff

**Files:**
- Modify: `skills/ogsm-translate/SKILL.md`

- [ ] **Step 1: Add ogsm-plan-annual prompt to the Handoff section**

In `skills/ogsm-translate/SKILL.md`, find the `## Handoff` section (currently ends with the audit-schedule/audit-plan choice). Append:

```markdown
- 優先事項輸出後（若尚未有年度計畫表）→ 也可推薦 `ogsm-plan-annual`：「要用 ogsm-plan-annual 把這份 OGSM 展開成全年 MD/MP 追蹤表嗎？」
```

The full Handoff section becomes:

```markdown
## Handoff

完成後根據情況推薦或執行下一步：
- 優先事項輸出後 → 推薦二選一：「要審查本週行程是否支持這些優先事項（`ogsm-audit-schedule`），還是審查現有計畫文件（`ogsm-audit-plan`）？」
- 優先事項輸出後（若尚未有年度計畫表）→ 也可推薦 `ogsm-plan-annual`：「要用 ogsm-plan-annual 把這份 OGSM 展開成全年 MD/MP 追蹤表嗎？」
```

- [ ] **Step 2: Commit**

```bash
git add skills/ogsm-translate/SKILL.md
git commit -m "feat: add ogsm-plan-annual handoff prompt to ogsm-translate"
```

---

## Task 5: Update `ogsm-weekly-review` SKILL.md

**Files:**
- Modify: `skills/ogsm-weekly-review/SKILL.md`

- [ ] **Step 1: Add md-actual marker instruction to Workflow step 3**

In `skills/ogsm-weekly-review/SKILL.md`, find step 3 (`Compare actual work against Strategies, MD, and MP.`). Replace it with:

```markdown
3. Compare actual work against Strategies, MD, and MP. When writing the MD movement summary, include a structured marker on the first line of that section so monthly actuals can be extracted later:
   `<!-- md-actual: MD1-1=<value>, MD1-2=<value> -->`
   Use the exact MD IDs from the profile. If a metric did not change, write `MD1-2=未變`. Omit MDs with no data this week.
```

- [ ] **Step 2: Commit**

```bash
git add skills/ogsm-weekly-review/SKILL.md
git commit -m "feat: add md-actual marker instruction to ogsm-weekly-review"
```

---

## Task 6: Update `validate-architecture.sh` + `storage-policy.md`

**Files:**
- Modify: `scripts/validate-architecture.sh`
- Modify: `references/storage-policy.md`

- [ ] **Step 1: Add `ogsm-plan-annual` to the skills list in `validate-architecture.sh`**

Find the line:

```sh
skills="ogsm-start ogsm-define ogsm-translate ogsm-audit-plan ogsm-audit-schedule ogsm-calendar-brief ogsm-realign ogsm-weekly-review ogsm-import"
```

Replace with:

```sh
skills="ogsm-start ogsm-define ogsm-translate ogsm-audit-plan ogsm-audit-schedule ogsm-calendar-brief ogsm-realign ogsm-weekly-review ogsm-import ogsm-plan-annual"
```

- [ ] **Step 2: Add `extract-md-actuals` and `generate-annual-plan` to the script executability check**

Find the line:

```sh
for script in validate-profile normalize-schedule normalize-calendar-events score-alignment update-operating-context prepare-storage validate-alignment; do
```

Replace with:

```sh
for script in validate-profile normalize-schedule normalize-calendar-events score-alignment update-operating-context prepare-storage validate-alignment extract-md-actuals generate-annual-plan; do
```

- [ ] **Step 3: Document `.ogsm/plans/` in `references/storage-policy.md`**

Find the directory tree block under `## Default Directory`. Replace with:

```markdown
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
```

Then add a new section after the `## Default Paths` block:

```markdown
## Annual Plan Paths

Annual plan tables are stored under `.ogsm/plans/`:

```text
.ogsm/plans/company/<company-slug>/<year>-annual.md
.ogsm/plans/departments/<dept-slug>/<year>-annual.md
```

These follow the same safety constraints as all other `.ogsm/` writes: target path, content summary, and explicit user confirmation are required before any write.
```

- [ ] **Step 4: Commit**

```bash
git add scripts/validate-architecture.sh references/storage-policy.md
git commit -m "feat: register ogsm-plan-annual in architecture validation and document plans/ path"
```

---

## Task 7: Run Full Validation + Final Commit

- [ ] **Step 1: Run all tests**

```bash
bash scripts/test-scripts.sh
```

Expected: exits 0 with no error output. All smoke tests pass, architecture validation passes.

- [ ] **Step 2: If `validate-architecture.sh` fails on missing `ogsm-plan-annual` in plugin.toml**

Verify that `plugin.toml` contains:

```toml
[[skills]]
name = "ogsm-plan-annual"
path = "skills/ogsm-plan-annual/SKILL.md"
```

If missing, add it and re-run.

- [ ] **Step 3: Verify the new skill directory is complete**

```bash
bash scripts/validate-architecture.sh
```

Expected: exits 0.

- [ ] **Step 4: Commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: ensure ogsm-plan-annual passes full architecture validation"
```

---

## Self-Review

**Spec coverage:**
- ✅ New skill `ogsm-plan-annual` with Generate and Update modes → Task 1
- ✅ `generate-annual-plan.js` script → Task 3
- ✅ `extract-md-actuals.js` script → Task 2
- ✅ `ogsm-translate` Handoff prompt → Task 4
- ✅ `ogsm-weekly-review` md-actual marker → Task 5
- ✅ `.ogsm/plans/` storage path → Task 6 (storage-policy.md)
- ✅ `validate-architecture.sh` updated → Task 6
- ✅ Smoke tests → Tasks 2, 3

**Placeholder scan:** None found. All steps have actual code.

**Type consistency:**
- `extract-md-actuals.js` outputs `{ [mdId: string]: string }` JSON — used by Claude (not another script), so no cross-script type dependency.
- `generate-annual-plan.js` input schema defined in fixture and used consistently throughout Task 3.
- MD IDs (e.g., `MD1-1`) match the format shown in `sample-annual-plan-input.json` and `sample-weekly-review-with-actuals.md`.
