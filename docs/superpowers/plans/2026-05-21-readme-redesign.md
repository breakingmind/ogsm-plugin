# README Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite README.md to be scenario-driven and use-case-grouped so installed users (company owners and managers) can immediately understand and use the plugin.

**Architecture:** Single file edit (README.md). Both English and 繁體中文 blocks receive identical structural changes. Sections are reorganised, not deleted — all existing content is preserved. New sections (scenarios, "我想做什麼？") are inserted; existing sections are reordered and lightly enhanced.

**Tech Stack:** Markdown only. No scripts, no tests, no build step. Verification = visual review in a Markdown renderer.

---

## File Map

| Action | Path |
|--------|------|
| Modify | `README.md` |
| Spec | `docs/superpowers/specs/2026-05-21-readme-redesign.md` |

---

## Task 1: Replace English "Plugin Overview" with "What Can This Plugin Do?"

The current `### Plugin Overview` (line 40) opens with a flow diagram and no scenario context. Replace it with a three-scenario section, then append the existing flow diagram and storage note beneath it.

**Files:**
- Modify: `README.md` (lines 40–60, English block)

- [ ] **Step 1: Replace the `### Plugin Overview` section**

Find this exact block (lines 40–60):

```markdown
### Plugin Overview

This plugin makes OGSM operational through a repeatable loop:

```
ogsm-import (existing OGSM)
    ↓
ogsm-define
    ↓
ogsm-translate ── ogsm-plan-annual (optional, year-start)
    ↓
ogsm-audit-plan  ──  ogsm-calendar-brief (optional)
ogsm-audit-schedule ──────────────────────────────┘
    ↓
ogsm-realign
    ↓
ogsm-weekly-review ── ogsm-plan-annual update (month-end)
```

Persistent OGSM data is stored under `.ogsm/` in your project. Nothing is written without your explicit confirmation.
```

Replace with:

```markdown
### What Can This Plugin Do?

**Strategy that never gets executed?**
A lot of strategy documents just sit there. This plugin turns your OGSM into what to do this week, what to say no to, and which metrics to watch — so strategy becomes weekly action instead of a document on the wall.

**Calendar full, but unclear what actually matters?**
Tell the plugin your schedule and it checks which time slots are advancing a Strategy and which are just consuming time — then gives you concrete suggestions for what to change.

**Metrics only reviewed at month-end?**
The plugin generates an HTML execution report from your weekly review data automatically. Progress and health status (🟢 On Track / 🟡 At Risk / 🔴 Off Track) for every indicator — no manual work, no server required.

---

### Plugin Loop

This plugin makes OGSM operational through a repeatable loop:

```
ogsm-import (existing OGSM)
    ↓
ogsm-define
    ↓
ogsm-translate ── ogsm-plan-annual (optional, year-start)
    ↓
ogsm-audit-plan  ──  ogsm-calendar-brief (optional)
ogsm-audit-schedule ──────────────────────────────┘
    ↓
ogsm-realign
    ↓
ogsm-weekly-review ── ogsm-plan-annual update (month-end)
```

Persistent OGSM data is stored under `.ogsm/` in your project. Nothing is written without your explicit confirmation.
```

- [ ] **Step 2: Verify visually**

Open `README.md` in a Markdown previewer. Confirm:
- `### What Can This Plugin Do?` appears after `### Quick Start`
- Three scenario paragraphs render correctly
- `### Plugin Loop` heading and flow diagram follow immediately after
- No content from the original `### Plugin Overview` is missing

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs(readme): replace Plugin Overview with scenario-driven intro (EN)"
```

---

## Task 2: Update English "Quick Start"

Replace the current Quick Start (lines 30–38) with a version that uses natural language triggers and notes that no skill names need to be memorised.

**Files:**
- Modify: `README.md` (lines 30–38, English block)

- [ ] **Step 1: Replace the `### Quick Start` section**

Find this exact block:

```markdown
### Quick Start

1. Install the plugin (see [Installation](#installation))
2. Restart Claude Code or Codex
3. Say **"help me develop an OGSM"** to create a new profile, or **"import an OGSM"** to import an existing one
4. Follow the skill prompts — one question at a time
5. Run **`ogsm-translate`** to turn your profile into this week's priorities
```

Replace with:

```markdown
### Quick Start

1. Install the plugin (see [Installation](#installation)) and restart Claude Code
2. Say **"help me get started with OGSM"** — the plugin detects your state and routes you correctly (no skill names to remember)
3. Answer the questions to build your profile — one question at a time
4. Say **"what should I focus on this week based on our OGSM?"** — get this week's execution priorities
5. Every Friday say **"let's do the weekly OGSM review"** — close the execution loop
```

- [ ] **Step 2: Verify visually**

Confirm the 5 steps render as a numbered list. Confirm bold phrases are visible.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs(readme): update EN Quick Start with natural language triggers"
```

---

## Task 3: Add English "What Do I Want To Do?" section

Insert a new `### What Do I Want To Do?` section after `### Plugin Loop` (i.e. after the existing Plugin Overview block ends, before `#### Company vs Department profiles`). This is the core use-case grouping.

**Files:**
- Modify: `README.md` (insert after Plugin Loop section, before `#### Company vs Department profiles`)

- [ ] **Step 1: Insert the new section**

Find this exact line (which currently follows the Plugin Overview block):

```markdown
#### Company vs Department profiles
```

Insert the following block immediately before it:

```markdown
---

### What Do I Want To Do?

---

#### Set up or import an OGSM

Don't know where to start? Say:
```
help me get started with OGSM
```
The plugin detects whether you have a profile and routes you to the right skill.

Already have an OGSM document? Say:
```
import my OGSM, the file is at ~/Downloads/strategy-2026.md
```
The plugin auto-maps non-standard headings (KPI → MD, OKR → Goals), confirms the mapping, then saves the profile.

Supports a two-tier structure: a **company profile** sets the top-level O/G/S/MD/MP; **department profiles** reference it. Department Goals can align to a company Goal or Strategy, or be declared as enabling goals that support other departments.

---

#### Turn your OGSM into this week's actions

At the start of each week say:
```
what should I focus on this week based on our OGSM?
```
Output: priority themes, time allocation guidance, MD check-in schedule, say-no list.

---

#### Review a plan or schedule

Audit a quarterly plan:
```
review this Q3 roadmap against our OGSM
```
The plugin maps each item to a Strategy, MD, and MP — scoring alignment and surfacing gaps.

Audit your week's schedule:
```
does my schedule this week support our OGSM?
```
Three-step flow: `ogsm-calendar-brief` (normalise calendar) → `ogsm-audit-schedule` (check time allocation) → `ogsm-realign` (output revised schedule).

---

#### Track execution progress

**Weekly review (every Friday):**
```
let's do the weekly OGSM review
```
Compares actual work against MD and MP, surfaces patterns, proposes context updates.

**HTML execution report (run any time):**

Generated from `.ogsm/` data — no server required:

```bash
node -e "
const { loadSources } = require('./scripts/ogsm-status/loader');
const { buildViewModel } = require('./scripts/ogsm-status/view-model');
const { render } = require('./scripts/ogsm-status/renderer');
const fs = require('fs');
const sources = loadSources('.ogsm', 'company', 'your-slug');
fs.writeFileSync('ogsm-report.html', render(buildViewModel(sources)));
"
open ogsm-report.html
```

Replace `your-slug` with the `slug` value in your company profile frontmatter.

Report sections:
- **Section 1** — Goal progress %, Strategy rows, MD progress bars, expandable MP plan cards
- **Section 2** — Health counts across all MDs (🟢 / 🟡 / 🔴 / ⚪)
- **Section 3** — Alignment diagnostics (missing MD for a Strategy, broken department refs, etc.)

**To get real numbers in the report:**
1. Complete `ogsm-define` so a profile exists
2. Run `ogsm-weekly-review` each week (this produces the actuals data)
3. Run the report command above

Until weekly reviews exist, all MDs show ⚪ No Data — this is correct behaviour.

**Annual plan table (create at year-start, update monthly):**
```
generate the annual plan table
```
Expands your OGSM into a 12-column monthly tracking table. At month-end say:
```
update this month's MD actuals
```
The plugin extracts figures from your weekly reviews, asks you to confirm, and fills in the actuals.

---

```

- [ ] **Step 2: Verify visually**

Confirm:
- `### What Do I Want To Do?` appears between the Plugin Loop and `#### Company vs Department profiles`
- Code blocks (dialogue examples and bash command) render correctly
- `#### Company vs Department profiles` still follows immediately after

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs(readme): add EN 'What Do I Want To Do?' use-case section"
```

---

## Task 4: Reorder English Skills section by workflow

The current `### Skills` section lists skills roughly alphabetically. Reorder to match the workflow sequence: ogsm-start → ogsm-import → ogsm-define → ogsm-translate → ogsm-calendar-brief → ogsm-audit-plan → ogsm-audit-schedule → ogsm-realign → ogsm-weekly-review → ogsm-plan-annual.

Also add a one-line note at the top of the section.

**Files:**
- Modify: `README.md` (lines 111–194, English Skills block)

- [ ] **Step 1: Add note to Skills section header**

Find:
```markdown
### Skills
```

Replace with:
```markdown
### Skills

> Not sure which skill to use? Say "help me get started with OGSM" and the plugin decides for you.
```

- [ ] **Step 2: Reorder the 10 skill entries**

The current order is: ogsm-start, ogsm-import, ogsm-define, ogsm-translate, ogsm-audit-plan, ogsm-audit-schedule, ogsm-calendar-brief, ogsm-realign, ogsm-weekly-review, ogsm-plan-annual.

Move `ogsm-calendar-brief` (currently after `ogsm-audit-schedule`) to immediately before `ogsm-audit-plan`. New order:

1. `ogsm-start`
2. `ogsm-import`
3. `ogsm-define`
4. `ogsm-translate`
5. `ogsm-calendar-brief`
6. `ogsm-audit-plan`
7. `ogsm-audit-schedule`
8. `ogsm-realign`
9. `ogsm-weekly-review`
10. `ogsm-plan-annual`

Cut the `#### ogsm-calendar-brief` block (lines 161–167) and paste it before `#### ogsm-audit-plan`.

- [ ] **Step 3: Verify visually**

Confirm skills appear in the new order. Confirm no skill entry was accidentally deleted.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs(readme): reorder EN skills by workflow sequence"
```

---

## Task 5: Enhance English OGSM Status Report section

Add a "Getting real data into the report" subsection to the existing `### OGSM Status Report` section. The architecture tables are kept verbatim — only the subsection is added.

**Files:**
- Modify: `README.md` (after `#### Running the report pipeline` block, before `### Storage Layout`)

- [ ] **Step 1: Insert subsection before `### Storage Layout`**

Find this exact line:
```markdown
### Storage Layout
```

Insert immediately before it:

```markdown
#### Getting real data into the report

Running the report before any weekly reviews exist will show ⚪ No Data for all MDs. This is correct — there are no actuals yet. To get real numbers:

1. **Complete `ogsm-define`** so a profile exists at `.ogsm/profiles/company/<slug>.md`
2. **Run `ogsm-weekly-review` each week** — each review writes structured `<!-- md-actual: MD1=..., MD2=... -->` markers that the loader extracts as actuals
3. **Generate the report:**

```bash
node -e "
const { loadSources } = require('./scripts/ogsm-status/loader');
const { buildViewModel } = require('./scripts/ogsm-status/view-model');
const { render } = require('./scripts/ogsm-status/renderer');
const fs = require('fs');
const sources = loadSources('.ogsm', 'company', 'your-slug');
fs.writeFileSync('ogsm-report.html', render(buildViewModel(sources)));
"
open ogsm-report.html
```

Replace `your-slug` with the `slug` field in your company profile frontmatter.

---

```

- [ ] **Step 2: Verify visually**

Confirm the new subsection renders between the smoke test block and `### Storage Layout`. Confirm the bash code block renders correctly.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs(readme): add EN 'Getting real data into the report' subsection"
```

---

## Task 6: Add note to English Installation section

Add a one-line guidance note at the top of the `### Installation` section.

**Files:**
- Modify: `README.md` (line 279, English Installation block)

- [ ] **Step 1: Add note**

Find:
```markdown
### Installation
```

Replace with:
```markdown
### Installation

> Recommended: complete the Quick Start first to confirm the plugin works before exploring advanced options.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs(readme): add EN installation note pointing to Quick Start"
```

---

## Task 7: Apply all changes to 繁體中文 block — scenarios + quick start

Mirror Tasks 1 and 2 in the Chinese block.

**Files:**
- Modify: `README.md` (lines ~403–460, 繁體中文 block)

- [ ] **Step 1: Replace `### Plugin 概覽` with scenarios section**

Find this exact block (around line 435):

```markdown
### Plugin 概覽

這個 plugin 透過一個可重複的迴圈讓 OGSM 真正落地：

```
ogsm-import（匯入既有 OGSM）
    ↓
ogsm-define（建立 profile）
    ↓
ogsm-translate（轉化為優先事項）── ogsm-plan-annual（年初建立年度計畫表，選用）
    ↓
ogsm-audit-plan（審查計劃）  ──  ogsm-calendar-brief（選用）
ogsm-audit-schedule（審查行程）────────────────────────┘
    ↓
ogsm-realign（重新對標）
    ↓
ogsm-weekly-review（週檢查 · 更新執行脈絡）── ogsm-plan-annual update（月底更新實際值）
```

OGSM 資料儲存於專案的 `.ogsm/` 目錄。任何寫入都需要您明確確認。
```

Replace with:

```markdown
### 這個 Plugin 能幫你做什麼？

**策略寫完沒人執行？**
很多策略文件寫完就躺在那裡。這個 plugin 把你的 OGSM 轉成每週要做什麼、什麼不用做、什麼指標要看——讓策略真的變成每週行動。

**行事曆滿了，但不確定哪些事情真的重要？**
告訴 plugin 這週的行程，它會幫你看哪些時段在推進策略、哪些只是在消耗時間，然後給你具體的調整建議。

**月底才發現指標沒在動？**
plugin 可以從你的週回顧資料自動生成一份 HTML 執行報告，每個指標的進度、健康狀態（🟢🟡🔴）一眼看清楚，不用手動整理也不需要伺服器。

---

### Plugin 執行迴圈

這個 plugin 透過一個可重複的迴圈讓 OGSM 真正落地：

```
ogsm-import（匯入既有 OGSM）
    ↓
ogsm-define（建立 profile）
    ↓
ogsm-translate（轉化為優先事項）── ogsm-plan-annual（年初建立年度計畫表，選用）
    ↓
ogsm-audit-plan（審查計劃）  ──  ogsm-calendar-brief（選用）
ogsm-audit-schedule（審查行程）────────────────────────┘
    ↓
ogsm-realign（重新對標）
    ↓
ogsm-weekly-review（週檢查 · 更新執行脈絡）── ogsm-plan-annual update（月底更新實際值）
```

OGSM 資料儲存於專案的 `.ogsm/` 目錄。任何寫入都需要您明確確認。
```

- [ ] **Step 2: Replace `### 快速開始`**

Find:
```markdown
### 快速開始

1. 安裝 plugin（見[安裝方式](#安裝方式)）
2. 重啟 Claude Code 或 Codex
3. 說 **「幫我建立 OGSM」** 建立新 profile，或 **「匯入我的 OGSM」** 匯入既有內容
4. 依照技能提示逐步完成 — 每次只回答一個問題
5. 執行 **`ogsm-translate`** 把 profile 轉化為本週執行優先事項
```

Replace with:
```markdown
### 快速開始

1. 安裝 plugin（見[安裝方式](#安裝方式)）並重啟 Claude Code
2. 說 **「幫我開始使用 OGSM」** — plugin 自動偵測你的狀態並引導（不需要記技能名稱）
3. 回答問題建立 OGSM profile — 每次只問一題
4. 說 **「根據我們的 OGSM，這週我應該專注在哪裡？」** — 取得本週執行優先事項
5. 每週五說 **「我們來做週 OGSM 檢查」** — 關閉執行迴圈
```

- [ ] **Step 3: Verify visually**

Confirm both sections render correctly in the Chinese block.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs(readme): add ZH scenarios section and update ZH Quick Start"
```

---

## Task 8: Add 繁體中文 "我想做什麼？" section

Insert before `#### 公司 vs 部門 profile 兩層架構` in the Chinese block.

**Files:**
- Modify: `README.md` (insert before `#### 公司 vs 部門 profile 兩層架構`)

- [ ] **Step 1: Insert section**

Find:
```markdown
#### 公司 vs 部門 profile 兩層架構
```

Insert immediately before it:

```markdown
---

### 我想做什麼？

---

#### 建立或匯入 OGSM

不知道從哪裡開始？直接說：
```
幫我開始使用 OGSM
```
plugin 會偵測你有沒有 profile，引導你建立或匯入。

已有 OGSM 文件想帶進來？
```
匯入我的 OGSM，檔案在 ~/Downloads/strategy-2026.md
```
plugin 自動對映非標準欄位（KPI → MD、OKR → Goals），確認後存檔。

支援公司與部門兩層結構——部門 profile 可對齊公司的 Goal 或 Strategy，也可宣告為跨部門支援型目標。

---

#### 把 OGSM 轉成本週行動

每週一開始說：
```
根據我們的 OGSM，這週我應該專注在哪裡？
```
輸出：本週優先主題、時間分配建議、MD 檢核提醒、說不清單。

---

#### 審查計劃或行程

審查季度計劃：
```
審查這份 Q3 路線圖是否對齊我們的 OGSM
```
plugin 把每個項目對應到 Strategy / MD / MP，標出缺口與未對齊的工作。

審查這週行程：
```
這週的行程支持我們的 OGSM 嗎？
```
三步流程：`ogsm-calendar-brief`（整理行事曆）→ `ogsm-audit-schedule`（檢查時間分配）→ `ogsm-realign`（輸出修訂版行程）。

---

#### 追蹤執行進度

**週回顧（每週五）：**
```
我們來做週 OGSM 檢查
```
比對實際工作與 MD / MP，找出落差，更新執行脈絡。

**HTML 執行報告（隨時可跑）：**

從 `.ogsm/` 資料生成，不需要伺服器：

```bash
node -e "
const { loadSources } = require('./scripts/ogsm-status/loader');
const { buildViewModel } = require('./scripts/ogsm-status/view-model');
const { render } = require('./scripts/ogsm-status/renderer');
const fs = require('fs');
const sources = loadSources('.ogsm', 'company', 'your-slug');
fs.writeFileSync('ogsm-report.html', render(buildViewModel(sources)));
"
open ogsm-report.html
```

將 `your-slug` 替換為你的公司 profile frontmatter 中的 `slug` 值。

報告內容：
- **Section 1** — 每個 Goal 進度 %、MD 進度條、可展開的 MP 計畫卡片
- **Section 2** — 全部 MD 健康狀態統計（🟢 / 🟡 / 🔴 / ⚪）
- **Section 3** — 結構缺口診斷（Strategy 無 MD、部門標註錯誤等）

**讓報告顯示真實數字：**
1. 完成 `ogsm-define`（有 profile 才能解析）
2. 每週執行 `ogsm-weekly-review`（產生 actuals 資料）
3. 執行上方的報告指令

尚無週回顧資料時，所有 MD 顯示 ⚪ No Data — 這是正確行為。

**年度計畫表（年初建立、月底更新）：**
```
產生年度計畫表
```
展開成 12 欄月份追蹤表。月底說：
```
更新本月實際值
```
plugin 自動從週回顧抽取數字，確認後填入。

---

```

- [ ] **Step 2: Verify visually**

Confirm section renders between `### Plugin 執行迴圈` and `#### 公司 vs 部門 profile 兩層架構`.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs(readme): add ZH '我想做什麼？' use-case section"
```

---

## Task 9: Update 繁體中文 skills section order + note

Mirror Task 4 in the Chinese block.

**Files:**
- Modify: `README.md` (lines ~506–590, ZH skills block)

- [ ] **Step 1: Add note to `### 各項技能說明`**

Find:
```markdown
### 各項技能說明
```

Replace with:
```markdown
### 各項技能說明

> 不確定用哪個技能？說「幫我開始使用 OGSM」，plugin 幫你判斷。
```

- [ ] **Step 2: Move `ogsm-calendar-brief` before `ogsm-audit-plan`**

The Chinese skills currently appear in the same order as English. Move the `#### \`ogsm-calendar-brief\` — 準備 Google Calendar 摘要` block (lines ~556–563) to appear before `#### \`ogsm-audit-plan\` — 審查計劃是否對齊 OGSM`.

New order:
1. ogsm-start
2. ogsm-import
3. ogsm-define
4. ogsm-translate
5. ogsm-calendar-brief ← moved up
6. ogsm-audit-plan
7. ogsm-audit-schedule
8. ogsm-realign
9. ogsm-weekly-review
10. ogsm-plan-annual

- [ ] **Step 3: Verify**

Confirm all 10 skills present in new order.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs(readme): reorder ZH skills by workflow + add note"
```

---

## Task 10: Add ZH report "getting real data" subsection + installation note

Mirror Tasks 5 and 6 in the Chinese block.

**Files:**
- Modify: `README.md` (ZH OGSM Status Report + Installation blocks)

- [ ] **Step 1: Insert subsection before `### 儲存結構`**

Find:
```markdown
### 儲存結構
```

Insert immediately before it (in the Chinese block, after the smoke test block):

```markdown
#### 讓報告顯示真實數字

執行報告前若尚無任何週回顧，所有 MD 會顯示 ⚪ No Data——這是正確行為，還沒有實際數據。要取得真實數字：

1. **完成 `ogsm-define`**，確保 profile 存在於 `.ogsm/profiles/company/<slug>.md`
2. **每週執行 `ogsm-weekly-review`**——每次回顧都會寫入結構化標記 `<!-- md-actual: MD1=..., MD2=... -->`，loader 會從這些標記取值
3. **生成報告：**

```bash
node -e "
const { loadSources } = require('./scripts/ogsm-status/loader');
const { buildViewModel } = require('./scripts/ogsm-status/view-model');
const { render } = require('./scripts/ogsm-status/renderer');
const fs = require('fs');
const sources = loadSources('.ogsm', 'company', 'your-slug');
fs.writeFileSync('ogsm-report.html', render(buildViewModel(sources)));
"
open ogsm-report.html
```

將 `your-slug` 替換為你的公司 profile frontmatter 中的 `slug` 值。

---

```

- [ ] **Step 2: Add note to `### 安裝方式`**

Find:
```markdown
### 安裝方式
```

Replace with:
```markdown
### 安裝方式

> 建議先跑快速開始，確認 plugin 運作後再看進階設定。
```

- [ ] **Step 3: Verify**

Confirm new subsection appears before `### 儲存結構` in the Chinese block. Confirm installation note renders.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs(readme): add ZH report data subsection and installation note"
```

---

## Task 11: Final review pass

- [ ] **Step 1: Full visual review**

Open `README.md` in a Markdown previewer and verify:

- Language toggle links at top still work (jump to `#english` and `#繁體中文`)
- `### What Can This Plugin Do?` present in EN block, `### 這個 Plugin 能幫你做什麼？` in ZH block
- `### What Do I Want To Do?` (EN) and `### 我想做什麼？` (ZH) present with all 4 subsections
- Both Quick Start sections use natural language triggers
- Both Skills sections have workflow-order note and calendar-brief moved before audit-plan
- Both report sections have "getting real data" subsection with runnable bash command
- Both installation sections have the "start here first" note
- No existing content missing (storage layout, safety, validation, install commands all intact)
- Bash code block in report sections renders as a code block (not broken by nested quotes)

- [ ] **Step 2: Final commit**

```bash
git add README.md
git commit -m "docs(readme): final review pass — scenario-driven README complete"
```

- [ ] **Step 3: Push**

```bash
git push
```
